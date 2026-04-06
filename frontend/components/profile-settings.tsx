"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveHomePath, useAuth } from "@/components/auth-provider";
import { GuardedPage } from "@/components/guarded-page";
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

export function ProfileSettings() {
  const router = useRouter();
  const { status, setUser, getAccessToken } = useAuth();
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
        setError(getErrorMessage(loadError, "Could not load your profile."));
      } finally {
        setLoading(false);
      }
    },
    [getAccessToken, router, setUser]
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
    if (profile.isExecutorActive) return "Executor mode is active";
    if (canBeExecutor) return "Executor role is available but not active";
    return "Customer account";
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
      setSuccess("Nothing changed in personal details.");
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
      setSuccess("Profile details saved.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not save profile details."));
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
      setSuccess("Avatar uploaded.");
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "Could not upload avatar."));
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
      setSuccess(profile.isExecutorActive ? "Executor mode disabled." : "Executor mode enabled.");
    } catch (executorError) {
      setError(getErrorMessage(executorError, "Could not update executor mode."));
    } finally {
      setSavingExecutor(false);
      setActiveSection(null);
    }
  }

  async function handleExecutorProfileSave() {
    if (!executorDirty) {
      setSuccess("Executor details are already up to date.");
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
      setSuccess("Executor details saved.");
    } catch (executorError) {
      setError(getErrorMessage(executorError, "Could not save executor details."));
    } finally {
      setSavingExecutor(false);
      setActiveSection(null);
    }
  }

  async function handleCategoriesSave() {
    if (selectedCategories.length === 0) {
      setError("Choose at least one category before saving.");
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
      setSuccess("Executor categories saved.");
    } catch (categoriesError) {
      setError(getErrorMessage(categoriesError, "Could not save executor categories."));
    } finally {
      setSavingCategories(false);
      setActiveSection(null);
    }
  }

  async function handleLocationsSave() {
    if (selectedLocations.length === 0) {
      setError("Choose at least one working location before saving.");
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
      setSuccess("Executor working locations saved.");
    } catch (locationsError) {
      setError(getErrorMessage(locationsError, "Could not save working locations."));
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
      title="Profile"
      description="Manage account information, executor status, categories and working locations from one responsive settings area."
    >
      {loading || !profile ? (
        <section className="tasko-card p-6">
          Loading profile...
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
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2f6bff] text-2xl font-semibold text-white">
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
                <div className="rounded-full bg-[#eef4ff] px-4 py-2 text-sm font-semibold text-[#315294]">
                  {executorStatusText}
                </div>
              </div>

              <div className="mb-5 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-[#f4f7fc] px-3 py-2 font-medium text-[#607392]">
                  Role: {getRoleLabel(profile.roleType)}
                </span>
                <span className="rounded-full bg-[#f4f7fc] px-3 py-2 font-medium text-[#607392]">
                  Created: {formatDate(profile.createdAtUtc)}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="tasko-label">First name</span>
                  <input
                    value={personalForm.firstName}
                    onChange={(event) =>
                      setPersonalForm((current) => ({ ...current, firstName: event.target.value }))
                    }
                    className="tasko-input"
                  />
                </label>

                <label className="space-y-2">
                  <span className="tasko-label">Last name</span>
                  <input
                    value={personalForm.lastName}
                    onChange={(event) =>
                      setPersonalForm((current) => ({ ...current, lastName: event.target.value }))
                    }
                    className="tasko-input"
                  />
                </label>

                <label className="space-y-2">
                  <span className="tasko-label">Phone</span>
                  <input
                    value={personalForm.phone}
                    onChange={(event) =>
                      setPersonalForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    className="tasko-input"
                  />
                </label>

                <label className="space-y-2">
                  <span className="tasko-label">Avatar from your computer</span>
                  <label className="flex min-h-[56px] cursor-pointer items-center justify-between rounded-[1.2rem] border border-dashed border-[#cdd9ee] bg-[#f8fbff] px-4 py-3 text-sm text-[#607392] transition hover:border-[#2f6bff] hover:bg-[#f4f8ff]">
                    <span className="truncate pr-3">
                      {uploadingAvatar
                        ? "Uploading avatar..."
                        : avatarFileName || "Choose image file"}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-[#315294] shadow-[0_10px_24px_rgba(47,107,255,0.08)]">
                      Browse
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
                    Upload a local photo instead of pasting a URL.
                  </p>
                </label>
              </div>

              {avatarSrc ? (
                <div className="mt-4 rounded-[1.4rem] border border-[#e5edf8] bg-[#f8fbff] p-4">
                  <p className="tasko-label mb-3">Current avatar</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={avatarSrc}
                      alt="Current avatar preview"
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-white"
                    />
                    <div className="text-sm tasko-muted">
                      {uploadingAvatar ? "Uploading new image..." : "Your current profile photo is active."}
                    </div>
                  </div>
                </div>
              ) : null}

              <label className="mt-4 block space-y-2">
                <span className="tasko-label">About</span>
                <textarea
                  value={personalForm.about}
                  onChange={(event) =>
                    setPersonalForm((current) => ({ ...current, about: event.target.value }))
                  }
                  rows={4}
                  className="tasko-input"
                  placeholder="Tell customers and executors a bit about yourself"
                />
              </label>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm tasko-muted">
                  Rating: <span className="font-semibold text-[var(--tasko-text)]">{profile.ratingAverage.toFixed(1)}</span>
                  {" "}({profile.ratingCount} reviews)
                </div>
                <button
                  type="button"
                  onClick={() => void handlePersonalSave()}
                  disabled={savingPersonal || !personalDirty}
                  className="tasko-primary-btn disabled:opacity-70"
                >
                  {savingPersonal && activeSection === "personal"
                    ? "Saving..."
                    : personalDirty
                      ? "Save personal details"
                      : "Personal details saved"}
                </button>
              </div>
            </article>

            <article className="tasko-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                Executor mode
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Activate your working profile
              </h2>
              <p className="mt-3 text-sm leading-7 tasko-muted">
                Your backend routes active executors to the feed. Here you can enable or disable that mode
                and update your base executor data.
              </p>

              <div className="mt-5 grid gap-4">
                <label className="space-y-2">
                  <span className="tasko-label">Main location</span>
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
                  <span className="tasko-label">Experience years</span>
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
                    ? "Updating..."
                    : profile.isExecutorActive
                      ? "Disable executor mode"
                      : "Enable executor mode"}
                </button>

                {canBeExecutor ? (
                  <button
                    type="button"
                    onClick={() => void handleExecutorProfileSave()}
                    disabled={savingExecutor || !executorDirty}
                    className="tasko-secondary-btn disabled:opacity-70"
                  >
                    {executorDirty ? "Save executor details" : "Executor details saved"}
                  </button>
                ) : null}
              </div>
            </article>
          </section>

          {profile.roleType !== UserRoleType.Customer ? (
            <section className="grid gap-6 xl:grid-cols-2">
              <article className="tasko-card p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  Categories
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Choose what work you do
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
                    ? "Saving..."
                    : "Save categories"}
                </button>
              </article>

              <article className="tasko-card p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  Working areas
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Select where you accept tasks
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
                    ? "Saving..."
                    : "Save locations"}
                </button>
              </article>
            </section>
          ) : null}
        </div>
      )}
    </GuardedPage>
  );
}

function getRoleLabel(roleType: number) {
  if (roleType === UserRoleType.Executor) return "Executor";
  if (roleType === UserRoleType.Both) return "Customer + Executor";
  return "Customer";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}
