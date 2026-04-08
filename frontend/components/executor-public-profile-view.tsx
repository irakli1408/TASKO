"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { resolveAssetUrl } from "@/lib/api";
import {
  Category,
  ExecutorReviewItem,
  ExecutorPublicProfile,
  getCategories,
  getErrorMessage,
  getExecutorPublicProfile,
  getExecutorReviews
} from "@/lib/profile";
import { LocationType } from "@/lib/auth";

type ExecutorPublicProfileViewProps = {
  executorId: number;
};

export function ExecutorPublicProfileView({ executorId }: ExecutorPublicProfileViewProps) {
  const router = useRouter();
  const { status, getAccessToken } = useAuth();
  const { locale, t } = useI18n();
  const [profile, setProfile] = useState<ExecutorPublicProfile | null>(null);
  const [reviews, setReviews] = useState<ExecutorReviewItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const token = await getAccessToken();

        const [publicProfile, categoryList, reviewList] = await Promise.all([
          getExecutorPublicProfile(executorId, token ?? undefined),
          token ? getCategories(token).catch(() => []) : Promise.resolve([]),
          getExecutorReviews(executorId, { take: 10 }).catch(() => [])
        ]);

        setProfile(publicProfile);
        setCategories(categoryList);
        setReviews(reviewList);
      } catch (loadError) {
        setError(getErrorMessage(loadError, t("executorProfile.loadError")));
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [executorId, getAccessToken, status, t]);

  const categoryNames = useMemo(() => {
    if (!profile) {
      return [];
    }

    const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

    return profile.categoryIds.map((categoryId) => categoryMap.get(categoryId) ?? `#${categoryId}`);
  }, [categories, profile]);

  return (
    <GuardedPage title={t("executorProfile.title")} description={t("executorProfile.description")}>
      {loading ? (
        <section className="tasko-card p-8 text-sm tasko-muted">{t("executorProfile.loading")}</section>
      ) : error || !profile ? (
        <section className="tasko-card p-8">
          <div className="rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error || t("executorProfile.loadError")}
          </div>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_360px]">
          <section className="grid gap-6">
            <article className="tasko-card p-6 sm:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4 sm:gap-5">
                  <ProfileAvatar
                    firstName={profile.firstName}
                    lastName={profile.lastName}
                    avatarUrl={profile.avatarUrl}
                  />

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-[2rem] font-semibold tracking-tight text-[var(--tasko-text)]">
                        {`${profile.firstName} ${profile.lastName}`.trim()}
                      </h2>
                      <span className="rounded-full bg-[#eef9f0] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#23915d]">
                        {t("task.executor")}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <ProfilePill label={t("executorProfile.location")} value={getLocationLabel(profile.locationType, t)} />
                      <ProfilePill label={t("executorProfile.phone")} value={profile.phone || t("task.notSet")} />
                      <ProfilePill
                        label={t("executorProfile.experience")}
                        value={formatExperience(profile.experienceYears, t)}
                      />
                      <ProfilePill
                        label={t("executorProfile.rating")}
                        value={formatRating(profile.ratingAverage, profile.ratingCount, t)}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-[#f5f8fd] px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                    {t("executorProfile.reputation")}
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-tight text-[var(--tasko-text)]">
                      {profile.ratingCount > 0 ? profile.ratingAverage.toFixed(1) : "New"}
                    </span>
                    <span className="text-sm tasko-muted">
                      {profile.ratingCount > 0
                        ? `${profile.ratingCount} ${t("executorProfile.reviews")}`
                        : t("executorProfile.noReviews")}
                    </span>
                  </div>
                </div>
              </div>
            </article>

            <article className="tasko-card p-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                <div className="tasko-soft-card p-5">
                  <p className="text-sm font-semibold text-[var(--tasko-text)]">
                    {t("executorProfile.about")}
                  </p>
                  <p className="mt-3 text-sm leading-8 tasko-muted">
                    {profile.about?.trim() || t("executorProfile.noAbout")}
                  </p>
                </div>

                <div className="tasko-soft-card p-5">
                  <p className="text-sm font-semibold text-[var(--tasko-text)]">
                    {t("executorProfile.quickFacts")}
                  </p>
                  <div className="mt-4 grid gap-3">
                    <MetricCard label={t("executorProfile.location")} value={getLocationLabel(profile.locationType, t)} />
                    <MetricCard label={t("executorProfile.phone")} value={profile.phone || t("task.notSet")} />
                    <MetricCard
                      label={t("executorProfile.experience")}
                      value={formatExperience(profile.experienceYears, t)}
                    />
                    <MetricCard
                      label={t("executorProfile.rating")}
                      value={formatRating(profile.ratingAverage, profile.ratingCount, t)}
                    />
                  </div>
                </div>
              </div>
            </article>

            <article className="tasko-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                    {t("executorProfile.categoriesLabel")}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                    {t("executorProfile.categoriesTitle")}
                  </h3>
                </div>
                <span className="tasko-pill">
                  {categoryNames.length} {t("executorProfile.categoriesCount")}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {categoryNames.length > 0 ? (
                  categoryNames.map((categoryName) => (
                    <span
                      key={categoryName}
                      className="rounded-full border border-[#dbe6f4] bg-[#f8fbff] px-4 py-2 text-sm font-semibold text-[#3d5b8b]"
                    >
                      {categoryName}
                    </span>
                  ))
                ) : (
                  <div className="tasko-soft-card w-full p-4 text-sm tasko-muted">
                    {t("executorProfile.noCategories")}
                  </div>
                )}
              </div>
            </article>

            <article className="tasko-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                    {t("executorProfile.reviewsLabel")}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                    {t("executorProfile.reviewsTitle")}
                  </h3>
                </div>
                <span className="tasko-pill">
                  {reviews.length} {t("executorProfile.reviews")}
                </span>
              </div>

              <div className="mt-5 grid gap-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-[1.6rem] border border-[#dfe7f3] bg-[#fbfdff] p-5 shadow-[0_12px_26px_rgba(42,78,148,0.05)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--tasko-text)]">
                            {review.fromUserName || t("profile.unknown")}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#8ba0c3]">
                            {formatReviewDate(review.createdAtUtc, locale)}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#fff6dd] px-3 py-1.5 text-sm font-semibold text-[#a46d00]">
                          {renderStars(review.score)}
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-7 tasko-muted">
                        {review.comment?.trim() || t("task.reviewNoComment")}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="tasko-soft-card p-4 text-sm tasko-muted">
                    {t("executorProfile.noReviews")}
                  </div>
                )}
              </div>
            </article>
          </section>

          <aside className="grid content-start gap-6">
            <article className="tasko-card p-6 lg:sticky lg:top-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                {t("executorProfile.summaryLabel")}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                {t("executorProfile.summaryTitle")}
              </h3>

              <div className="mt-5 grid gap-3">
                <MetricCard label={t("executorProfile.rating")} value={formatRating(profile.ratingAverage, profile.ratingCount, t)} />
                <MetricCard label={t("executorProfile.location")} value={getLocationLabel(profile.locationType, t)} />
                <MetricCard label={t("executorProfile.phone")} value={profile.phone || t("task.notSet")} />
                <MetricCard label={t("executorProfile.experience")} value={formatExperience(profile.experienceYears, t)} />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => router.back()} className="tasko-secondary-btn">
                  {t("executorProfile.back")}
                </button>
                <Link href="/feed" className="tasko-primary-btn">
                  {t("executorProfile.openFeed")}
                </Link>
              </div>
            </article>
          </aside>
        </div>
      )}
    </GuardedPage>
  );
}

function ProfileAvatar({
  firstName,
  lastName,
  avatarUrl
}: {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolveAssetUrl(avatarUrl)}
        alt={`${firstName} ${lastName}`.trim()}
        className="h-24 w-24 rounded-full object-cover shadow-[0_18px_36px_rgba(42,78,148,0.16)]"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#2f6bff] text-2xl font-semibold text-white shadow-[0_18px_36px_rgba(42,78,148,0.16)]">
      {`${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()}
    </div>
  );
}

function ProfilePill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-[#dfe7f3] bg-white px-3 py-2 text-sm font-semibold text-[#4a628a]">
      {`${label}: ${value}`}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">{value}</p>
    </div>
  );
}

function getLocationLabel(locationType: LocationType, t: (key: string) => string) {
  if (locationType === LocationType.AllCity) return t("location.allCity");
  if (locationType === LocationType.Mtatsminda) return t("location.mtatsminda");
  if (locationType === LocationType.Vake) return t("location.vake");
  if (locationType === LocationType.Saburtalo) return t("location.saburtalo");
  if (locationType === LocationType.Krtsanisi) return t("location.krtsanisi");
  if (locationType === LocationType.Isani) return t("location.isani");
  if (locationType === LocationType.Samgori) return t("location.samgori");
  if (locationType === LocationType.Chugureti) return t("location.chugureti");
  if (locationType === LocationType.Didube) return t("location.didube");
  if (locationType === LocationType.Nadzaladevi) return t("location.nadzaladevi");
  if (locationType === LocationType.Gldani) return t("location.gldani");
  return `Location #${locationType}`;
}

function formatExperience(years: number | null, t: (key: string) => string) {
  if (years === null || years === undefined) {
    return t("task.notSet");
  }

  return years === 1 ? t("task.oneYear") : `${years} ${t("task.years")}`;
}

function formatRating(ratingAverage: number, ratingCount: number, t: (key: string) => string) {
  if (ratingCount <= 0) {
    return t("executorProfile.noReviews");
  }

  return `${ratingAverage.toFixed(1)} / 5 (${ratingCount})`;
}

function renderStars(score: number) {
  return "★".repeat(score) + "☆".repeat(Math.max(0, 5 - score));
}

function formatReviewDate(value: string, locale: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

