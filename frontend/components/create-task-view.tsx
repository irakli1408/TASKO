"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { resolveAssetUrl } from "@/lib/api";
import { LocationType } from "@/lib/auth";
import { Category, getCategories, getErrorMessage } from "@/lib/profile";
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
  categoryId: string;
  locationType: LocationType;
};

const locationOptions: { value: LocationType; label: string }[] = [
  { value: LocationType.AllCity, label: "All city" },
  { value: LocationType.Mtatsminda, label: "Mtatsminda" },
  { value: LocationType.Vake, label: "Vake" },
  { value: LocationType.Saburtalo, label: "Saburtalo" },
  { value: LocationType.Krtsanisi, label: "Krtsanisi" },
  { value: LocationType.Isani, label: "Isani" },
  { value: LocationType.Samgori, label: "Samgori" },
  { value: LocationType.Chugureti, label: "Chugureti" },
  { value: LocationType.Didube, label: "Didube" },
  { value: LocationType.Nadzaladevi, label: "Nadzaladevi" },
  { value: LocationType.Gldani, label: "Gldani" }
];

const initialForm: TaskForm = {
  title: "",
  description: "",
  budget: "",
  categoryId: "",
  locationType: LocationType.AllCity
};

export function CreateTaskView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
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
  const editTaskId = useMemo(() => {
    const raw = searchParams.get("taskId");

    if (!raw) {
      return null;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);

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
      setCategories(result);

      if (!editTaskId) {
        setCreatedTask(null);
        setUploadedImages([]);
        setForm(initialForm);
        return;
      }

      const myTasks = await getMyTasks(token, { take: 100 });
      const taskToEdit = myTasks.find((task) => task.id === editTaskId);

      if (!taskToEdit) {
        throw new Error("Task was not found in your workspace.");
      }

      setCreatedTask(taskToEdit);
      setForm({
        title: taskToEdit.title,
        description: taskToEdit.description ?? "",
        budget: taskToEdit.budget !== null ? String(taskToEdit.budget) : "",
        categoryId: String(taskToEdit.categoryId),
        locationType: taskToEdit.locationType
      });

      const imageResult = await getTaskImages(token, taskToEdit.id).catch(() => []);
      setUploadedImages(imageResult);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load task setup."));
    } finally {
      setLoadingCategories(false);
    }
  }

  async function withToken<T>(action: (token: string) => Promise<T>) {
    const token = await getAccessToken();

    if (!token) {
      router.replace("/login");
      throw new Error("Not authenticated");
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

  async function handleSaveDraft() {
    if (!isValidDraft) {
      setError("Add a title, choose a category, and enter a valid budget if you want to include one.");
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
                categoryId: payload.categoryId,
                locationType: payload.locationType
              }
            : current
        );
        setSuccess("Draft updated.");
      } else {
        const created = await withToken((token) => createTask(token, payload));
        setCreatedTask(created);
        setSuccess("Draft created. You can now upload images or publish the task.");
      }
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not save task draft."));
    } finally {
      setSavingDraft(false);
    }
  }

  async function handlePublish() {
    if (!createdTask) {
      setError("Create the draft first, then publish it.");
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
      setSuccess("Task published.");
    } catch (publishError) {
      setError(getErrorMessage(publishError, "Could not publish this task."));
    } finally {
      setPublishing(false);
    }
  }

  async function handleImageUpload(files: File[]) {
    if (!createdTask || files.length === 0) {
      setError("Create the draft first, then upload images.");
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

      setSuccess(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded.`);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "Could not upload task images."));
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
      setSuccess("Image removed.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Could not remove that image."));
    } finally {
      setDeletingFileId(null);
    }
  }

  return (
    <GuardedPage
      title="Create task"
      description="Start with a task draft, then upload images and publish when everything looks right."
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

        <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
          <article className="tasko-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  Task draft
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--tasko-text)]">
                  {createdTask ? "Continue task editing" : "Describe the work clearly"}
                </h2>
              </div>
              <span className="tasko-pill">
                {createdTask ? createdTask.status : "Draft not created"}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="tasko-label">Task title</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="tasko-input"
                  placeholder="Bathroom repair, cleaning, furniture assembly..."
                />
              </label>

              <label className="space-y-2">
                <span className="tasko-label">Budget</span>
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
                <span className="tasko-label">Main location</span>
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

              <label className="space-y-2 sm:col-span-2">
                <span className="tasko-label">Category</span>
                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, categoryId: event.target.value }))
                  }
                  className="tasko-input"
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories ? "Loading categories..." : "Choose a category"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="tasko-label">Description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={6}
                className="tasko-input"
                placeholder="Explain what needs to be done, timing, materials, and any access details."
              />
            </label>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleSaveDraft()}
                disabled={savingDraft || loadingCategories}
                className="tasko-primary-btn disabled:opacity-70"
              >
                {savingDraft ? (createdTask ? "Updating..." : "Creating...") : createdTask ? "Update draft" : "Create draft"}
              </button>

              {createdTask ? (
                <button
                  type="button"
                  onClick={() => void handlePublish()}
                  disabled={publishing || createdTask.status.toLowerCase() === "published"}
                  className="tasko-secondary-btn disabled:opacity-70"
                >
                  {publishing
                    ? "Publishing..."
                    : createdTask.status.toLowerCase() === "published"
                      ? "Already published"
                      : "Publish task"}
                </button>
              ) : null}

              {createdTask ? (
                <Link href={`/tasks/${createdTask.id}`} className="tasko-secondary-btn">
                  Open details
                </Link>
              ) : null}
            </div>
          </article>

          <div className="grid gap-6">
            <article className="tasko-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                Flow
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                How posting works in Tasko
              </h2>

              <div className="mt-5 grid gap-3">
                <FlowItem
                  index="01"
                  title="Create draft"
                  text="Save the core task details first so the backend creates a real draft record."
                />
                <FlowItem
                  index="02"
                  title="Add images"
                  text="Once the draft exists, you can upload local photos to make the task clearer."
                />
                <FlowItem
                  index="03"
                  title="Publish"
                  text="Publishing moves the task from draft into the visible marketplace feed."
                />
              </div>
            </article>

            <article className="tasko-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                Images
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                Upload task photos
              </h2>
              <p className="mt-3 text-sm leading-7 tasko-muted">
                Add photos after the draft exists. This uses your backend task media upload endpoint.
              </p>

              <label className="mt-5 flex min-h-[64px] cursor-pointer items-center justify-between rounded-[1.4rem] border border-dashed border-[#cdd9ee] bg-[#f8fbff] px-4 py-3 text-sm text-[#607392] transition hover:border-[#2f6bff] hover:bg-[#f4f8ff]">
                <span className="pr-4">
                  {createdTask
                    ? uploadingImages
                      ? "Uploading images..."
                      : "Choose one or more local images"
                    : "Create the draft first to unlock uploads"}
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-[#315294] shadow-[0_10px_24px_rgba(47,107,255,0.08)]">
                  Browse
                </span>
                <input
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

              {uploadedImages.length > 0 ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {uploadedImages.map((image) => (
                    <div key={image.fileId} className="tasko-soft-card overflow-hidden p-0">
                      <img
                        src={resolveAssetUrl(image.url)}
                        alt={`Task image ${image.fileId}`}
                        className="h-40 w-full object-cover"
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
                          {deletingFileId === image.fileId ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tasko-soft-card mt-5 p-4 text-sm tasko-muted">
                  No task images uploaded yet.
                </div>
              )}
            </article>
          </div>
        </section>
      </div>
    </GuardedPage>
  );
}

function FlowItem({ index, title, text }: { index: string; title: string; text: string }) {
  return (
    <div className="tasko-soft-card flex items-start gap-4 p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#2f6bff]">
        {index}
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--tasko-text)]">{title}</p>
        <p className="mt-2 text-sm leading-7 tasko-muted">{text}</p>
      </div>
    </div>
  );
}
