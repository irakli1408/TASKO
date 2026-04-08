"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { resolveAssetUrl } from "@/lib/api";
import { LocationType } from "@/lib/auth";
import { Category, CategoryTree, getCategories, getCategoryTree, getErrorMessage } from "@/lib/profile";
import {
  TaskImage,
  TaskRecord,
  createTask,
  deleteTaskImage,
  getMyTasks,
  getTaskImages,
  publishTask,
  updateTask,
  uploadTaskImages
} from "@/lib/tasks";

type TaskForm = {
  title: string;
  description: string;
  budget: string;
  preferredTime: string;
  categoryId: string;
  locationType: LocationType;
};

const initialForm: TaskForm = {
  title: "",
  description: "",
  budget: "",
  preferredTime: "",
  categoryId: "",
  locationType: LocationType.AllCity
};

export function CreateTaskView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessToken } = useAuth();
  const { t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([]);
  const [selectedRootCategoryId, setSelectedRootCategoryId] = useState<number | null>(null);
  const [form, setForm] = useState<TaskForm>(initialForm);
  const [createdTask, setCreatedTask] = useState<TaskRecord | null>(null);
  const [uploadedImages, setUploadedImages] = useState<TaskImage[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inlineImagesInputId = useId();
  const sidebarImagesInputId = useId();
  const editTaskId = useMemo(() => {
    const raw = searchParams.get("taskId");

    if (!raw) {
      return null;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);
  const locationOptions = useMemo<{ value: LocationType; label: string }[]>(
    () => [
      { value: LocationType.AllCity, label: t("location.allCity") },
      { value: LocationType.Mtatsminda, label: t("location.mtatsminda") },
      { value: LocationType.Vake, label: t("location.vake") },
      { value: LocationType.Saburtalo, label: t("location.saburtalo") },
      { value: LocationType.Krtsanisi, label: t("location.krtsanisi") },
      { value: LocationType.Isani, label: t("location.isani") },
      { value: LocationType.Samgori, label: t("location.samgori") },
      { value: LocationType.Chugureti, label: t("location.chugureti") },
      { value: LocationType.Didube, label: t("location.didube") },
      { value: LocationType.Nadzaladevi, label: t("location.nadzaladevi") },
      { value: LocationType.Gldani, label: t("location.gldani") }
    ],
    [t]
  );

  useEffect(() => {
    void loadInitialData();
  }, [editTaskId]);

  async function loadInitialData() {
    setLoadingCategories(true);
    setError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const result = await getCategories(token);
      const tree = await getCategoryTree(token);
      setCategories(result);
      setCategoryTree(tree);

      if (!editTaskId) {
        setCreatedTask(null);
        setUploadedImages([]);
        setForm(initialForm);
        setSelectedRootCategoryId(tree[0]?.id ?? null);
        return;
      }

      const myTasks = await getMyTasks(token, { take: 100 });
      const taskToEdit = myTasks.find((task) => task.id === editTaskId);

      if (!taskToEdit) {
        throw new Error(t("createTask.notFound"));
      }

      setCreatedTask(taskToEdit);
      setForm({
        title: taskToEdit.title,
        description: taskToEdit.description ?? "",
        budget: taskToEdit.budget !== null ? String(taskToEdit.budget) : "",
        preferredTime: taskToEdit.preferredTime ?? "",
        categoryId: String(taskToEdit.categoryId),
        locationType: taskToEdit.locationType
      });
      setSelectedRootCategoryId(findRootCategoryId(tree, taskToEdit.categoryId) ?? tree[0]?.id ?? null);

      const imageResult = await getTaskImages(token, taskToEdit.id).catch(() => []);
      setUploadedImages(imageResult);
    } catch (loadError) {
      setError(getErrorMessage(loadError, t("createTask.loadSetupError")));
    } finally {
      setLoadingCategories(false);
    }
  }

  async function withToken<T>(action: (token: string) => Promise<T>) {
    const token = await getAccessToken();

    if (!token) {
      router.replace("/login");
      throw new Error(t("createTask.notAuthenticated"));
    }

    return action(token);
  }

  const parsedBudget = useMemo(() => {
    if (!form.budget.trim()) {
      return null;
    }

    const value = Number(form.budget);
    return Number.isFinite(value) ? value : Number.NaN;
  }, [form.budget]);

  const isValidDraft = useMemo(() => {
    return Boolean(form.title.trim() && form.categoryId.trim()) && !Number.isNaN(parsedBudget);
  }, [form.categoryId, form.title, parsedBudget]);
  const selectedRootCategory = useMemo(
    () => categoryTree.find((item) => item.id === selectedRootCategoryId) ?? categoryTree[0] ?? null,
    [categoryTree, selectedRootCategoryId]
  );
  const selectedLeafCategoryId = Number(form.categoryId);
  const currentStep = useMemo(() => {
    const hasCategory = Boolean(form.categoryId.trim());
    const hasTitle = Boolean(form.title.trim());
    const hasDescription = Boolean(form.description.trim());
    const hasBudget = Boolean(form.budget.trim()) && !Number.isNaN(parsedBudget);
    const hasImages = uploadedImages.length > 0;

    if (!hasCategory) {
      return 1;
    }

    if (!hasTitle || !hasDescription) {
      return 2;
    }

    if (!hasBudget) {
      return 3;
    }

    if (!hasImages) {
      return 4;
    }

    return 5;
  }, [form.budget, form.categoryId, form.description, form.title, parsedBudget, uploadedImages.length]);

  async function handleSaveDraft() {
    if (!isValidDraft) {
      setError(t("createTask.invalidDraft"));
      return;
    }

    setSavingDraft(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        budget: parsedBudget,
        preferredTime: form.preferredTime.trim() || null,
        categoryId: Number(form.categoryId),
        locationType: form.locationType
      };

      if (createdTask) {
        await withToken((token) => updateTask(token, createdTask.id, payload));
        setCreatedTask((current) =>
          current
            ? {
                ...current,
                title: payload.title,
                description: payload.description,
                budget: payload.budget,
                preferredTime: payload.preferredTime,
                categoryId: payload.categoryId,
                locationType: payload.locationType
              }
            : current
        );
        setSuccess(t("createTask.draftUpdated"));
              } else {
                const created = await withToken((token) => createTask(token, payload));
                setCreatedTask(created);
                setSuccess(t("createTask.draftCreated"));
      }
    } catch (saveError) {
      setError(getErrorMessage(saveError, t("createTask.saveDraftError")));
    } finally {
      setSavingDraft(false);
    }
  }

  async function handlePublish() {
    if (!createdTask) {
      setError(t("createTask.createDraftFirst"));
      return;
    }

    setPublishing(true);
    setError("");
    setSuccess("");

    try {
      await withToken((token) => publishTask(token, createdTask.id));
      setCreatedTask((current) =>
        current
          ? {
              ...current,
              status: "Published"
            }
          : current
      );
      setSuccess(t("createTask.publishedSuccess"));
    } catch (publishError) {
      setError(getErrorMessage(publishError, t("createTask.publishError")));
    } finally {
      setPublishing(false);
    }
  }

  async function handleImageUpload(files: File[]) {
    if (!createdTask || files.length === 0) {
      setError(t("createTask.uploadAfterDraft"));
      return;
    }

    setUploadingImages(true);
    setError("");
    setSuccess("");

    try {
        const uploaded = await withToken((token) =>
          uploadTaskImages(token, createdTask.id, files)
        );

      setUploadedImages((current) => {
        const byId = new Map(current.map((item) => [item.fileId, item]));

        for (const item of uploaded) {
          byId.set(item.fileId, item);
        }

        return Array.from(byId.values()).sort((left, right) => left.sortOrder - right.sortOrder);
      });

      setSuccess(
        uploaded.length > 1
          ? `${uploaded.length} ${t("createTask.imagesUploaded")}`
          : `1 ${t("createTask.imageUploaded")}`
      );
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, t("createTask.imagesUploadError")));
    } finally {
      setUploadingImages(false);
    }
  }

  async function handleDeleteImage(fileId: number) {
    if (!createdTask) {
      return;
    }

    setDeletingFileId(fileId);
    setError("");
    setSuccess("");

    try {
      await withToken((token) => deleteTaskImage(token, createdTask.id, fileId));
      setUploadedImages((current) => current.filter((item) => item.fileId !== fileId));
      setSuccess(t("createTask.imageRemoved"));
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, t("createTask.imageRemoveError")));
    } finally {
      setDeletingFileId(null);
    }
  }

  return (
    <GuardedPage
      title={t("createTask.title")}
      description={t("createTask.description")}
    >
      <div className="grid gap-6">
        {error ? (
          <div className="rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {success}
          </div>
        ) : null}

        <section className="tasko-card p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-6">
            <div className="grid gap-3 sm:grid-cols-4">
              <StepPill index={1} active={currentStep === 1} completed={currentStep > 1} label={t("createTask.category")} />
              <StepPill
                index={2}
                active={currentStep === 2}
                completed={currentStep > 2}
                label={t("createTask.descriptionLabel")}
              />
              <StepPill index={3} active={currentStep === 3} completed={currentStep > 3} label={t("feed.budget")} />
              <StepPill
                index={4}
                active={currentStep === 4}
                completed={currentStep > 4}
                label={t("createTask.images")}
              />
            </div>

            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--tasko-text)]">
                {currentStep === 1
                  ? t("createTask.category")
                  : currentStep === 2
                    ? t("createTask.descriptionLabel")
                    : currentStep === 3
                      ? t("feed.budget")
                      : t("createTask.images")}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 tasko-muted">
                {t("createTask.flowTitle")}
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {categoryTree.map((category, index) => {
                    const isActive = category.id === selectedRootCategory?.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setSelectedRootCategoryId(category.id);

                          if (!category.children.some((child) => child.id === selectedLeafCategoryId)) {
                            setForm((current) => ({
                              ...current,
                              categoryId: String(category.children[0]?.id ?? "")
                            }));
                          }
                        }}
                        className={`rounded-[28px] bg-gradient-to-br p-5 text-left text-white shadow-[0_18px_36px_rgba(46,78,145,0.16)] transition hover:scale-[1.01] ${
                          rootCategoryClass(index)
                        } ${isActive ? "ring-4 ring-[#dff0ff]" : ""}`}
                      >
                        <div className="flex min-h-[150px] flex-col justify-between">
                          <div className="flex items-start justify-between gap-3">
                            <p className="max-w-[160px] text-[1.55rem] font-semibold leading-tight">
                              {capitalizeFirst(category.name)}
                            </p>
                            <span
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm ${
                                isActive ? "opacity-100" : "opacity-70"
                              }`}
                            >
                              {isActive ? "✓" : "○"}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-white/80">
                            {category.children.length} subcategories
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-[28px] bg-[#f5f8fd] px-4 py-5 sm:px-5">
                  <p className="text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                    {selectedRootCategory ? capitalizeFirst(selectedRootCategory.name) : t("createTask.category")}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {selectedRootCategory?.children.map((subcategory, index) => {
                      const isActive = subcategory.id === selectedLeafCategoryId;

                      return (
                        <button
                          key={subcategory.id}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              categoryId: String(subcategory.id)
                            }))
                          }
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            isActive
                              ? "bg-[#23bea1] text-white shadow-[0_12px_26px_rgba(35,190,161,0.24)]"
                              : index === 0
                                ? "bg-white text-[#334764] shadow-[0_6px_16px_rgba(53,83,127,0.08)]"
                                : "bg-white text-[#334764] shadow-[0_6px_16px_rgba(53,83,127,0.08)]"
                          }`}
                        >
                          {capitalizeFirst(subcategory.name)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4">
                  <label className="space-y-2">
                    <span className="tasko-label">{t("createTask.taskTitle")}</span>
                    <input
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, title: event.target.value }))
                      }
                      className="tasko-input"
                      placeholder={t("createTask.taskTitlePlaceholder")}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="tasko-label">{t("createTask.descriptionLabel")}</span>
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                      rows={4}
                      className="tasko-input"
                      placeholder={t("createTask.descriptionPlaceholder")}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="tasko-label">{t("createTask.preferredTime")}</span>
                    <input
                      type="time"
                      value={form.preferredTime}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, preferredTime: event.target.value }))
                      }
                      className="tasko-input"
                      placeholder={t("createTask.preferredTimePlaceholder")}
                    />
                  </label>

                  <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                    <label className="space-y-2">
                      <span className="tasko-label">{t("feed.budget")}</span>
                      <input
                        value={form.budget}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, budget: event.target.value }))
                        }
                        inputMode="decimal"
                        className="tasko-input"
                        placeholder="120"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="tasko-label">{t("createTask.mainLocation")}</span>
                      <select
                        value={form.locationType}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            locationType: Number(event.target.value) as LocationType
                          }))
                        }
                        className="tasko-input"
                      >
                        {locationOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="space-y-2">
                      <span className="tasko-label">{t("createTask.images")}</span>
                      <label
                        htmlFor={inlineImagesInputId}
                        className={`flex min-h-[52px] items-center justify-center rounded-[18px] border border-dashed px-4 text-sm font-semibold transition ${
                          createdTask
                            ? "cursor-pointer border-[#cfdced] bg-[#f8fbff] text-[#36507c] hover:border-[#2f6bff]"
                            : "cursor-not-allowed border-[#dfe6f2] bg-[#f4f6fa] text-[#95a3bc]"
                        }`}
                      >
                        {createdTask
                          ? uploadingImages
                            ? t("createTask.uploadingImages")
                            : t("createTask.browse")
                          : t("createTask.createDraftFirst")}
                        <input
                          id={inlineImagesInputId}
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          disabled={!createdTask || uploadingImages}
                          onChange={(event) => {
                            const files = Array.from(event.target.files ?? []);
                            void handleImageUpload(files);
                            event.target.value = "";
                          }}
                        />
                      </label>
                      {!createdTask ? (
                        <p className="text-xs leading-6 text-[#8fa0bc]">
                          {t("createTask.uploadAfterDraft")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <aside className="grid gap-5">
                <article className="rounded-[28px] border border-[#dfe8f6] bg-gradient-to-b from-[#f8fbff] to-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                    {t("createTask.draft")}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                    {createdTask ? t("createTask.continueEditing") : t("createTask.describeWork")}
                  </h3>

                  <div className="mt-5 rounded-[24px] bg-white p-4 shadow-[0_14px_28px_rgba(43,82,168,0.08)]">
                    <div
                      className={`rounded-[22px] bg-gradient-to-r px-4 py-5 text-white ${rootCategoryClass(
                        categoryTree.findIndex((item) => item.id === selectedRootCategory?.id)
                      )}`}
                    >
                      <p className="text-sm font-semibold opacity-90">Tasko</p>
                      <p className="mt-2 text-2xl font-semibold leading-tight">
                        {form.title.trim() || (selectedRootCategory ? capitalizeFirst(selectedRootCategory.name) : t("createTask.title"))}
                      </p>
                      <div className="mt-4 grid gap-1 text-sm text-white/90">
                        <span>
                          {t("feed.budget")}: {form.budget.trim() || "—"}
                        </span>
                        <span>
                          {t("task.preferredTime")}: {form.preferredTime.trim() || "—"}
                        </span>
                        <span>
                          {t("createTask.mainLocation")}:{" "}
                          {locationOptions.find((item) => item.value === form.locationType)?.label ?? "—"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedRootCategory ? (
                        <span className="rounded-full bg-[#eaf7f1] px-3 py-1.5 text-xs font-semibold text-[#1f8b64]">
                          {capitalizeFirst(selectedRootCategory.name)}
                        </span>
                      ) : null}
                      {selectedRootCategory?.children
                        .filter((item) => item.id === selectedLeafCategoryId)
                        .map((item) => (
                          <span
                            key={item.id}
                            className="rounded-full bg-[#edf3ff] px-3 py-1.5 text-xs font-semibold text-[#315294]"
                          >
                            {capitalizeFirst(item.name)}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleSaveDraft()}
                      disabled={savingDraft || loadingCategories}
                      className="tasko-primary-btn disabled:opacity-70"
                    >
                      {savingDraft
                        ? createdTask
                          ? t("createTask.updating")
                          : t("createTask.creating")
                        : createdTask
                          ? t("createTask.updateDraft")
                          : t("createTask.createDraft")}
                    </button>

                    {createdTask ? (
                      <button
                        type="button"
                        onClick={() => void handlePublish()}
                        disabled={publishing || createdTask.status.toLowerCase() === "published"}
                        className="tasko-secondary-btn disabled:opacity-70"
                      >
                        {publishing
                          ? t("createTask.publishing")
                          : createdTask.status.toLowerCase() === "published"
                            ? t("createTask.alreadyPublished")
                            : t("createTask.publishTask")}
                      </button>
                    ) : null}

                    {createdTask ? (
                      <Link href={`/tasks/${createdTask.id}`} className="tasko-secondary-btn">
                        {t("createTask.openDetails")}
                      </Link>
                    ) : null}
                  </div>
                </article>

                <article className="tasko-card p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                    {t("createTask.images")}
                  </p>
                  <p className="mt-3 text-sm leading-7 tasko-muted">
                    {t("createTask.uploadPhotosText")}
                  </p>

                  <label
                    htmlFor={sidebarImagesInputId}
                    className={`mt-4 flex min-h-[58px] items-center justify-center rounded-[20px] border border-dashed px-4 text-sm font-semibold transition ${
                      createdTask
                        ? "cursor-pointer border-[#cfdced] bg-[#f8fbff] text-[#36507c] hover:border-[#2f6bff]"
                        : "cursor-not-allowed border-[#dfe6f2] bg-[#f4f6fa] text-[#95a3bc]"
                    }`}
                  >
                    {createdTask
                      ? uploadingImages
                        ? t("createTask.uploadingImages")
                        : t("createTask.chooseImages")
                      : t("createTask.createDraftFirst")}
                    <input
                      id={sidebarImagesInputId}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      disabled={!createdTask || uploadingImages}
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);
                        void handleImageUpload(files);
                        event.target.value = "";
                      }}
                    />
                  </label>

                  {!createdTask ? (
                    <p className="mt-3 text-xs leading-6 text-[#8fa0bc]">
                      {t("createTask.uploadAfterDraft")}
                    </p>
                  ) : null}

                  {uploadedImages.length > 0 ? (
                    <div className="mt-4 grid gap-3">
                      {uploadedImages.map((image) => (
                        <div key={image.fileId} className="tasko-soft-card overflow-hidden p-0">
                          <img
                            src={resolveAssetUrl(image.url)}
                            alt={`Task image ${image.fileId}`}
                            className="h-32 w-full object-cover"
                          />
                          <div className="flex items-center justify-between gap-3 p-4">
                            <div className="text-xs tasko-muted">
                              {(image.sizeBytes / 1024).toFixed(0)} KB
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleDeleteImage(image.fileId)}
                              disabled={deletingFileId === image.fileId}
                              className="rounded-full border border-[#d7e2f3] px-3 py-1.5 text-xs font-semibold text-[#36507c] transition hover:border-[#b8c9e6] disabled:opacity-70"
                            >
                              {deletingFileId === image.fileId ? t("createTask.removing") : t("createTask.remove")}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="tasko-soft-card mt-4 p-4 text-sm tasko-muted">
                      {t("createTask.noImages")}
                    </div>
                  )}
                </article>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </GuardedPage>
  );
}

function StepPill({
  index,
  label,
  active = false,
  completed = false
}: {
  index: number;
  label: string;
  active?: boolean;
  completed?: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] border px-4 py-4 ${
        active
          ? "border-[#cfe7ff] bg-[#f5fbff]"
          : completed
            ? "border-[#d8f3e7] bg-[#f2fdf7]"
            : "border-[#e5edf8] bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            active
              ? "bg-[#2f6bff] text-white"
              : completed
                ? "bg-[#22C55E] text-white"
                : "bg-[#edf3ff] text-[#315294]"
          }`}
        >
          {completed ? "✓" : index}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--tasko-text)]">{label}</p>
        </div>
      </div>
    </div>
  );
}

function rootCategoryClass(index: number) {
  const safeIndex = index >= 0 ? index : 0;
  const classes = [
    "from-[#22b8a5] to-[#38d3be]",
    "from-[#2f6bff] to-[#4f8dff]",
    "from-[#2f6bff] to-[#5681ff]",
    "from-[#4b7dff] to-[#6b61ff]",
    "from-[#2f6bff] to-[#5976ff]"
  ];

  return classes[safeIndex % classes.length];
}

function findRootCategoryId(tree: CategoryTree[], categoryId: number) {
  for (const root of tree) {
    if (root.id === categoryId) {
      return root.id;
    }

    if (root.children.some((child) => child.id === categoryId)) {
      return root.id;
    }
  }

  return null;
}

function capitalizeFirst(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getTaskStatusLabel(status: string, t: (key: string) => string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "draft") return t("task.statusDraft");
  if (normalized === "published") return t("task.statusPublished");
  if (normalized === "assigned") return t("task.statusAssigned");
  if (normalized === "inprogress" || normalized === "in progress") return t("task.statusInProgress");
  if (normalized === "completed") return t("task.statusCompleted");
  if (normalized === "cancelled" || normalized === "canceled") return t("task.statusCancelled");

  return status;
}
