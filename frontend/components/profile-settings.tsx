"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveHomePath, useAuth } from "@/components/auth-provider";
import { GuardedPage } from "@/components/guarded-page";
import { useI18n } from "@/components/i18n-provider";
import { LocationType, UserRoleType } from "@/lib/auth";
import { resolveAssetUrl } from "@/lib/api";
import {
  Category,
  MyProfile,
  disableExecutor,
  enableExecutor,
  getCategories,
  getErrorMessage,
  getMyExecutorCategories,
  getMyExecutorLocations,
  getMyProfile,
  mapProfileToCurrentUser,
  uploadMyAvatar,
  updateExecutorProfile,
  updateMyExecutorCategories,
  updateMyExecutorLocations,
  updateMyProfile
} from "@/lib/profile";

type PersonalForm = {
  firstName: string;
  lastName: string;
  phone: string;
  about: string;
  avatarUrl: string;
};

export function ProfileSettings() {
  const router = useRouter();
  const { status, setUser, getAccessToken } = useAuth();
  const { locale, t } = useI18n();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [savedCategories, setSavedCategories] = useState<number[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<LocationType[]>([]);
  const [savedLocations, setSavedLocations] = useState<LocationType[]>([]);
  const [personalForm, setPersonalForm] = useState<PersonalForm>({
    firstName: "",
    lastName: "",
    phone: "",
    about: "",
    avatarUrl: ""
  });
  const [experienceYears, setExperienceYears] = useState("");
  const [executorLocationType, setExecutorLocationType] = useState<LocationType>(LocationType.AllCity);
  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingExecutor, setSavingExecutor] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [savingLocations, setSavingLocations] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFileName, setAvatarFileName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeSection, setActiveSection] = useState<
    "personal" | "executor" | "categories" | "locations" | null
  >(null);

  const canBeExecutor =
    profile?.roleType === UserRoleType.Executor || profile?.roleType === UserRoleType.Both;

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

  const avatarSrc = useMemo(() => resolveAssetUrl(profile?.avatarUrl), [profile?.avatarUrl]);

  const loadProfile = useMemo(
    () => async () => {
      setLoading(true);
      setError("");

      try {
        const token = await getAccessToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        const [myProfile, allCategories] = await Promise.all([
          getMyProfile(token),
          getCategories(token)
        ]);

        setProfile(myProfile);
        setCategories(allCategories);
        setPersonalForm({
          firstName: myProfile.firstName,
          lastName: myProfile.lastName,
          phone: myProfile.phone,
          about: myProfile.about ?? "",
          avatarUrl: myProfile.avatarUrl ?? ""
        });
        setExperienceYears(
          myProfile.executor?.experienceYears !== null &&
            myProfile.executor?.experienceYears !== undefined
            ? String(myProfile.executor.experienceYears)
            : ""
        );
        setExecutorLocationType(myProfile.locationType);
        setUser(mapProfileToCurrentUser(myProfile));

        if (myProfile.roleType !== UserRoleType.Customer) {
          const [myCategories, myLocations] = await Promise.all([
            getMyExecutorCategories(token),
            getMyExecutorLocations(token)
          ]);

          setSelectedCategories(myCategories);
          setSavedCategories(myCategories);
          setSelectedLocations(myLocations.locationTypes);
          setSavedLocations(myLocations.locationTypes);
      } else {
          setSelectedCategories([]);
          setSavedCategories([]);
          setSelectedLocations([]);
          setSavedLocations([]);
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError, t("profile.loadError")));
      } finally {
        setLoading(false);
      }
    },
    [getAccessToken, router, setUser, t]
  );

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    void loadProfile();
  }, [loadProfile, status]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => setSuccess(""), 3200);
    return () => window.clearTimeout(timer);
  }, [success]);

  const executorStatusText = useMemo(() => {
    if (!profile) return "";
    if (profile.isExecutorActive) return t("profile.executorActive");
    if (canBeExecutor) return t("profile.executorAvailable");
    return t("profile.customerAccount");
  }, [canBeExecutor, profile, t]);

  const executorStatusClass = useMemo(() => {
    if (!profile) {
      return "bg-[#EEF4FF] text-[#315294]";
    }

    if (profile.isExecutorActive) {
      return "bg-[#EEF9F0] text-[#23915D]";
    }

    if (canBeExecutor) {
      return "bg-[#FFF7E8] text-[#D48A12]";
    }

    return "bg-[#EEF4FF] text-[#315294]";
  }, [canBeExecutor, profile]);

  const personalDirty = useMemo(() => {
    if (!profile) {
      return false;
    }

    return (
      personalForm.firstName !== profile.firstName ||
      personalForm.lastName !== profile.lastName ||
      personalForm.phone !== profile.phone ||
      personalForm.about !== (profile.about ?? "") ||
      personalForm.avatarUrl !== (profile.avatarUrl ?? "")
    );
  }, [personalForm, profile]);

  const executorDirty = useMemo(() => {
    if (!profile) {
      return false;
    }

    const currentYears =
      profile.executor?.experienceYears !== null &&
      profile.executor?.experienceYears !== undefined
        ? String(profile.executor.experienceYears)
        : "";

    return (
      executorLocationType !== profile.locationType ||
      experienceYears !== currentYears
    );
  }, [executorLocationType, experienceYears, profile]);

  const categoriesDirty = useMemo(() => {
    if (!profile || profile.roleType === UserRoleType.Customer) {
      return false;
    }

    const current = [...selectedCategories].sort((a, b) => a - b).join(",");
    const initial = [...savedCategories].sort((a, b) => a - b).join(",");
    return current !== initial;
  }, [profile, savedCategories, selectedCategories]);

  const locationsDirty = useMemo(() => {
    if (!profile || profile.roleType === UserRoleType.Customer) {
      return false;
    }

    const current = [...selectedLocations].sort((a, b) => a - b).join(",");
    const initial = [...savedLocations].sort((a, b) => a - b).join(",");
    return current !== initial;
  }, [profile, savedLocations, selectedLocations]);

  function updateLocalProfile(nextProfile: MyProfile) {
    setProfile(nextProfile);
    setUser(mapProfileToCurrentUser(nextProfile));
    setExecutorLocationType(nextProfile.locationType);
    setExperienceYears(
      nextProfile.executor?.experienceYears !== null &&
        nextProfile.executor?.experienceYears !== undefined
        ? String(nextProfile.executor.experienceYears)
        : ""
    );
    setPersonalForm({
      firstName: nextProfile.firstName,
      lastName: nextProfile.lastName,
      phone: nextProfile.phone,
      about: nextProfile.about ?? "",
      avatarUrl: nextProfile.avatarUrl ?? ""
    });
  }

  async function withToken<T>(action: (token: string) => Promise<T>) {
    const token = await getAccessToken();

    if (!token) {
      router.replace("/login");
      throw new Error("Not authenticated");
    }

    return action(token);
  }

  async function handlePersonalSave() {
    if (!personalDirty) {
      setSuccess(t("profile.nothingChanged"));
      return;
    }

    setSavingPersonal(true);
    setActiveSection("personal");
    setError("");
    setSuccess("");

    try {
      const nextProfile = await withToken((token) =>
        updateMyProfile(token, {
          firstName: personalForm.firstName.trim(),
          lastName: personalForm.lastName.trim(),
          phone: personalForm.phone.trim(),
          about: personalForm.about.trim() || null,
          avatarUrl: personalForm.avatarUrl.trim() || null
        })
      );

      updateLocalProfile(nextProfile);
      setSuccess(t("profile.saved"));
    } catch (saveError) {
      setError(getErrorMessage(saveError, t("profile.personalSaveError")));
    } finally {
      setSavingPersonal(false);
      setActiveSection(null);
    }
  }

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true);
    setError("");
    setSuccess("");
    setAvatarFileName(file.name);

    try {
      const nextProfile = await withToken((token) => uploadMyAvatar(token, file));
      updateLocalProfile(nextProfile);
      setSuccess(t("profile.avatarUploaded"));
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, t("profile.avatarUploadError")));
      setAvatarFileName("");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleExecutorToggle() {
    if (!profile) return;

    setSavingExecutor(true);
    setActiveSection("executor");
    setError("");
    setSuccess("");

    try {
      const years = experienceYears.trim() ? Number(experienceYears) : null;
      const nextProfile = profile.isExecutorActive
        ? await withToken((token) => disableExecutor(token))
        : await withToken((token) =>
            enableExecutor(token, {
              locationType: executorLocationType,
              experienceYears: Number.isFinite(years) ? years : null
            })
          );

      updateLocalProfile(nextProfile);

      if (!profile.isExecutorActive) {
        const token = await getAccessToken();
        if (token) {
          const [myCategories, myLocations] = await Promise.all([
            getMyExecutorCategories(token),
            getMyExecutorLocations(token)
          ]);
          setSelectedCategories(myCategories);
          setSelectedLocations(myLocations.locationTypes);
        }
      }

      router.replace(resolveHomePath(mapProfileToCurrentUser(nextProfile)));
      setSuccess(
        profile.isExecutorActive ? t("profile.executorDisabled") : t("profile.executorEnabled")
      );
    } catch (executorError) {
      setError(getErrorMessage(executorError, t("profile.executorToggleError")));
    } finally {
      setSavingExecutor(false);
      setActiveSection(null);
    }
  }

  async function handleExecutorProfileSave() {
    if (!executorDirty) {
      setSuccess(t("profile.executorUpToDate"));
      return;
    }

    setSavingExecutor(true);
    setActiveSection("executor");
    setError("");
    setSuccess("");

    try {
      const years = experienceYears.trim() ? Number(experienceYears) : null;
      const nextProfile = await withToken((token) =>
        updateExecutorProfile(token, {
          experienceYears: Number.isFinite(years) ? years : null
        })
      );

      updateLocalProfile(nextProfile);
      setSuccess(t("profile.executorSaved"));
    } catch (executorError) {
      setError(getErrorMessage(executorError, t("profile.executorSaveError")));
    } finally {
      setSavingExecutor(false);
      setActiveSection(null);
    }
  }

  async function handleCategoriesSave() {
    if (selectedCategories.length === 0) {
      setError(t("profile.chooseCategory"));
      return;
    }

    setSavingCategories(true);
    setActiveSection("categories");
    setError("");
    setSuccess("");

    try {
      const updated = await withToken((token) =>
        updateMyExecutorCategories(token, selectedCategories)
      );

      setSelectedCategories(updated);
      setSavedCategories(updated);
      setSuccess(t("profile.categoriesSaved"));
    } catch (categoriesError) {
      setError(getErrorMessage(categoriesError, t("profile.categoriesError")));
    } finally {
      setSavingCategories(false);
      setActiveSection(null);
    }
  }

  async function handleLocationsSave() {
    if (selectedLocations.length === 0) {
      setError(t("profile.chooseLocation"));
      return;
    }

    setSavingLocations(true);
    setActiveSection("locations");
    setError("");
    setSuccess("");

    try {
      const updated = await withToken((token) =>
        updateMyExecutorLocations(token, selectedLocations)
      );

      setSelectedLocations(updated.locationTypes);
      setSavedLocations(updated.locationTypes);
      setSuccess(t("profile.locationsSaved"));
    } catch (locationsError) {
      setError(getErrorMessage(locationsError, t("profile.locationsError")));
    } finally {
      setSavingLocations(false);
      setActiveSection(null);
    }
  }

  function toggleCategory(categoryId: number) {
    setSelectedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((value) => value !== categoryId)
        : [...current, categoryId]
    );
  }

  function toggleLocation(locationType: LocationType) {
    setSelectedLocations((current) =>
      current.includes(locationType)
        ? current.filter((value) => value !== locationType)
        : [...current, locationType]
    );
  }

  return (
    <GuardedPage
      title={t("profile.title")}
      description={t("profile.description")}
    >
      {loading || !profile ? (
        <section className="tasko-card p-6">
          {t("profile.loading")}
        </section>
      ) : (
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

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="tasko-card p-6">
              <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="h-16 w-16 rounded-full object-cover ring-4 ring-[#eef4ff]"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F1FF] text-2xl font-semibold text-[#2563EB]">
                      {profile.firstName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <p className="text-sm tasko-muted">{profile.email}</p>
                  </div>
                </div>
                <div className={`rounded-full px-4 py-2 text-sm font-semibold ${executorStatusClass}`}>
                  {executorStatusText}
                </div>
              </div>

              <div className="mb-5 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-[var(--tasko-border)] bg-[var(--tasko-soft)] px-3 py-2 font-medium text-[#607392]">
                  {t("profile.role")}: {getRoleLabel(profile.roleType, t)}
                </span>
                <span className="rounded-full border border-[var(--tasko-border)] bg-[var(--tasko-soft)] px-3 py-2 font-medium text-[#607392]">
                  {t("profile.created")}: {formatDate(profile.createdAtUtc, locale, t)}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="tasko-label">{t("auth.firstName")}</span>
                  <input
                    value={personalForm.firstName}
                    onChange={(event) =>
                      setPersonalForm((current) => ({ ...current, firstName: event.target.value }))
                    }
                    className="tasko-input"
                  />
                </label>

                <label className="space-y-2">
                  <span className="tasko-label">{t("auth.lastName")}</span>
                  <input
                    value={personalForm.lastName}
                    onChange={(event) =>
                      setPersonalForm((current) => ({ ...current, lastName: event.target.value }))
                    }
                    className="tasko-input"
                  />
                </label>

                <label className="space-y-2">
                  <span className="tasko-label">{t("auth.phone")}</span>
                  <input
                    value={personalForm.phone}
                    onChange={(event) =>
                      setPersonalForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    className="tasko-input"
                  />
                </label>

                <label className="space-y-2">
                  <span className="tasko-label">{t("profile.avatarFromComputer")}</span>
                  <label className="flex min-h-[56px] cursor-pointer items-center justify-between rounded-[1.2rem] border border-dashed border-[#cdd9ee] bg-[#f8fbff] px-4 py-3 text-sm text-[#607392] transition hover:border-[var(--tasko-primary)] hover:bg-[#f4f8ff]">
                    <span className="truncate pr-3">
                      {uploadingAvatar
                        ? t("profile.uploadingAvatar")
                        : avatarFileName || t("profile.chooseImage")}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-[#315294] shadow-[0_10px_24px_rgba(47,107,255,0.08)]">
                      {t("profile.browse")}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                          void handleAvatarUpload(file);
                        }

                        event.target.value = "";
                      }}
                    />
                  </label>
                  <p className="text-xs tasko-muted">
                    {t("profile.uploadLocalPhoto")}
                  </p>
                </label>
              </div>

              {avatarSrc ? (
                <div className="mt-4 rounded-[1.4rem] border border-[#e5edf8] bg-[#f8fbff] p-4">
                  <p className="tasko-label mb-3">{t("profile.currentAvatar")}</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={avatarSrc}
                      alt="Current avatar preview"
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-white"
                    />
                    <div className="text-sm tasko-muted">
                      {uploadingAvatar
                        ? t("profile.uploadingImage")
                        : t("profile.currentAvatarActive")}
                    </div>
                  </div>
                </div>
              ) : null}

              <label className="mt-4 block space-y-2">
                <span className="tasko-label">{t("profile.about")}</span>
                <textarea
                  value={personalForm.about}
                  onChange={(event) =>
                    setPersonalForm((current) => ({ ...current, about: event.target.value }))
                  }
                  rows={4}
                  className="tasko-input"
                  placeholder={t("profile.aboutPlaceholder")}
                />
              </label>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm tasko-muted">
                  {t("profile.rating")}:{" "}
                  <span className="font-semibold text-[var(--tasko-text)]">
                    {profile.ratingAverage.toFixed(1)}
                  </span>{" "}
                  ({profile.ratingCount} {t("profile.reviews")})
                </div>
                <button
                  type="button"
                  onClick={() => void handlePersonalSave()}
                  disabled={savingPersonal || !personalDirty}
                  className="tasko-primary-btn disabled:opacity-70"
                >
                  {savingPersonal && activeSection === "personal"
                    ? t("profile.saving")
                    : personalDirty
                      ? t("profile.savePersonal")
                      : t("profile.personalSaved")}
                </button>
              </div>
            </article>

            <article className="tasko-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                {t("profile.executorMode")}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                {t("profile.activateWorkingProfile")}
              </h2>
              <p className="mt-3 text-sm leading-7 tasko-muted">
                {t("profile.executorText")}
              </p>

              <div className="mt-5 grid gap-4">
                <label className="space-y-2">
                  <span className="tasko-label">{t("profile.mainLocation")}</span>
                  <select
                    value={executorLocationType}
                    onChange={(event) => setExecutorLocationType(Number(event.target.value) as LocationType)}
                    className="tasko-input"
                  >
                    {locationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="tasko-label">{t("profile.experienceYears")}</span>
                  <input
                    value={experienceYears}
                    onChange={(event) => setExperienceYears(event.target.value)}
                    inputMode="numeric"
                    className="tasko-input"
                    placeholder="2"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleExecutorToggle()}
                  disabled={savingExecutor}
                  className="tasko-primary-btn disabled:opacity-70"
                >
                  {savingExecutor && activeSection === "executor"
                    ? t("profile.executorUpdating")
                    : profile.isExecutorActive
                      ? t("profile.disableExecutor")
                      : t("profile.enableExecutor")}
                </button>

                {canBeExecutor ? (
                  <button
                    type="button"
                    onClick={() => void handleExecutorProfileSave()}
                    disabled={savingExecutor || !executorDirty}
                    className="tasko-secondary-btn disabled:opacity-70"
                  >
                    {executorDirty ? t("profile.saveExecutorDetails") : t("profile.executorDetailsSaved")}
                  </button>
                ) : null}
              </div>
            </article>
          </section>

          {profile.roleType !== UserRoleType.Customer ? (
            <section className="grid gap-6 xl:grid-cols-2">
              <article className="tasko-card p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  {t("profile.categories")}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  {t("profile.chooseWork")}
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {categories.map((category) => {
                    const selected = selectedCategories.includes(category.id);

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                          selected
                            ? "border-[#2f6bff] bg-[#2f6bff] text-white"
                            : "border-[#dfe7f3] bg-[#f8fbff] text-[#5d7498] hover:border-[#cbd8ef]"
                        }`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => void handleCategoriesSave()}
                  disabled={savingCategories || selectedCategories.length === 0}
                  className="tasko-primary-btn mt-5 disabled:opacity-70"
                >
                  {savingCategories && activeSection === "categories"
                    ? t("profile.saving")
                    : t("profile.saveCategories")}
                </button>
              </article>

              <article className="tasko-card p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  {t("profile.workingAreas")}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  {t("profile.selectAreas")}
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {locationOptions.map((location) => {
                    const selected = selectedLocations.includes(location.value);

                    return (
                      <button
                        key={location.value}
                        type="button"
                        onClick={() => toggleLocation(location.value)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                          selected
                            ? "border-[#2f6bff] bg-[#2f6bff] text-white"
                            : "border-[#dfe7f3] bg-[#f8fbff] text-[#5d7498] hover:border-[#cbd8ef]"
                        }`}
                      >
                        {location.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => void handleLocationsSave()}
                  disabled={savingLocations || selectedLocations.length === 0}
                  className="tasko-primary-btn mt-5 disabled:opacity-70"
                >
                  {savingLocations && activeSection === "locations"
                    ? t("profile.saving")
                    : t("profile.saveLocations")}
                </button>
              </article>
            </section>
          ) : null}
        </div>
      )}
    </GuardedPage>
  );
}

function getRoleLabel(roleType: number, t: (key: string) => string) {
  if (roleType === UserRoleType.Executor) return t("profile.roleExecutor");
  if (roleType === UserRoleType.Both) return t("profile.roleBoth");
  return t("profile.roleCustomer");
}

function formatDate(value: string, locale: string, t: (key: string) => string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t("profile.unknown");
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}
