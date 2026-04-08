"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { LocationType } from "@/lib/auth";
import { getErrorMessage } from "@/lib/profile";
import { MyJobItem, getMyJobs } from "@/lib/tasks";

type JobStatus = "assigned" | "inprogress" | "completed";

export function MyJobsView() {
  const { getAccessToken } = useAuth();
  const { locale, t } = useI18n();
  const [jobs, setJobs] = useState<MyJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | JobStatus>("all");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error(t("createTask.notAuthenticated"));
      }

      const result = await getMyJobs(token);
      setJobs(result);
    } catch (loadError) {
      setError(getErrorMessage(loadError, t("myJobs.loadError")));
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, t]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    if (statusFilter === "all") {
      return jobs;
    }

    return jobs.filter((job) => normalizeJobStatus(job.status) === statusFilter);
  }, [jobs, statusFilter]);

  const stats = useMemo(
    () => ({
      total: jobs.length,
      active: jobs.filter((job) => {
        const status = normalizeJobStatus(job.status);
        return status === "assigned" || status === "inprogress";
      }).length,
      completed: jobs.filter((job) => normalizeJobStatus(job.status) === "completed").length
    }),
    [jobs]
  );

  return (
    <GuardedPage title={t("myJobs.title")} description={t("myJobs.description")}>
      <div className="grid gap-6">
        {error ? (
          <div className="rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <JobStatCard label={t("myJobs.allJobs")} value={String(stats.total)} tone="blue" />
          <JobStatCard label={t("myJobs.active")} value={String(stats.active)} tone="amber" />
          <JobStatCard label={t("myJobs.completed")} value={String(stats.completed)} tone="green" />
        </section>

        <section className="tasko-card overflow-hidden p-0">
          <div className="border-b border-[var(--tasko-border)] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  {t("myJobs.workspace")}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                  {t("myJobs.currentJobs")}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {([
                  ["all", t("myJobs.filterAll")],
                  ["assigned", t("task.statusAssigned")],
                  ["inprogress", t("task.statusInProgress")],
                  ["completed", t("task.statusCompleted")]
                ] as const).map(([value, label]) => {
                  const active = statusFilter === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-[#111827] text-white shadow-[0_12px_24px_rgba(17,24,39,0.14)]"
                          : "border border-[#dfe7f3] bg-white text-[#607392] hover:border-[#cbd8eb]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="tasko-soft-card p-6 text-sm tasko-muted">{t("myJobs.loading")}</div>
            ) : filteredJobs.length === 0 ? (
              <div className="tasko-soft-card p-6 text-sm tasko-muted">{t("myJobs.empty")}</div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredJobs.map((job) => {
                  const normalizedStatus = normalizeJobStatus(job.status);
                  const timelineDate = getJobTimelineDate(job);
                  const timelineLabel = getJobTimelineLabel(normalizedStatus, t);

                  return (
                    <article
                      key={job.taskId}
                      className="rounded-[1.8rem] border border-[#dfe7f3] bg-white p-5 shadow-[0_16px_34px_rgba(42,78,148,0.08)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getJobTone(
                                normalizedStatus
                              )}`}
                            >
                              {getJobStatusLabel(normalizedStatus, t)}
                            </span>
                          </div>
                          <h3 className="mt-3 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                            {job.taskTitle}
                          </h3>
                          <p className="mt-2 text-sm tasko-muted">{job.customerName}</p>
                        </div>

                        <div className="rounded-[1.25rem] bg-[#f4f7fc] px-4 py-3 text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                            {t("feed.budget")}
                          </p>
                          <p className="mt-2 text-lg font-semibold text-[var(--tasko-text)]">
                            {job.budget !== null ? formatBudget(job.budget, locale) : t("task.notSet")}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-7 tasko-muted">
                        {job.taskDescription?.trim() || t("myTasks.noDescription")}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <JobMetaCard label={t("myJobs.category")} value={job.categoryName} />
                        <JobMetaCard label={t("myJobs.location")} value={getLocationLabel(job.locationType, t)} />
                        <JobMetaCard
                          label={timelineLabel}
                          value={timelineDate ? formatDate(timelineDate, locale) : t("myJobs.notStartedYet")}
                        />
                      </div>

                      {job.preferredTime?.trim() ? (
                        <div className="mt-4 inline-flex rounded-full border border-[rgba(59,130,246,0.14)] bg-[rgba(59,130,246,0.07)] px-3 py-1.5 text-xs font-semibold text-[#315294]">
                          {t("task.preferredTime")}: {job.preferredTime}
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link href={`/tasks/${job.taskId}`} className="tasko-secondary-btn">
                          {t("myJobs.openTask")}
                        </Link>
                        {normalizedStatus === "completed" ? (
                          <Link href={`/tasks/${job.taskId}`} className="tasko-secondary-btn">
                            {t("myJobs.reviewResult")}
                          </Link>
                        ) : (
                          <Link href={`/tasks/${job.taskId}/chat`} className="tasko-primary-btn">
                            {t("myJobs.openChat")}
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </GuardedPage>
  );
}

function JobStatCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "blue" | "amber" | "green";
}) {
  const toneClass =
    tone === "blue"
      ? "bg-[#eef4ff] text-[#2f6bff]"
      : tone === "amber"
        ? "bg-[#fff7e8] text-[#d48a12]"
        : "bg-[#eef9f0] text-[#23915d]";

  return (
    <div className="tasko-card p-5">
      <div className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClass}`}>
        {label}
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[var(--tasko-text)]">{value}</p>
    </div>
  );
}

function JobMetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] bg-[#f4f7fc] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">{value}</p>
    </div>
  );
}

function getJobTone(status: JobStatus) {
  if (status === "completed") return "bg-[#eef9f0] text-[#23724d]";
  if (status === "inprogress") return "bg-[#fff7e8] text-[#d48a12]";
  return "bg-[#eef4ff] text-[#2f6bff]";
}

function getJobStatusLabel(status: JobStatus, t: (key: string) => string) {
  if (status === "completed") return t("task.statusCompleted");
  if (status === "inprogress") return t("task.statusInProgress");
  return t("task.statusAssigned");
}

function getJobTimelineLabel(status: JobStatus, t: (key: string) => string) {
  if (status === "completed") return t("myJobs.completedAt");
  if (status === "inprogress") return t("myJobs.startedAt");
  return t("myJobs.assignedAt");
}

function getJobTimelineDate(job: MyJobItem): string | null {
  const status = normalizeJobStatus(job.status);

  if (status === "completed") {
    return job.completedAtUtc ?? job.startedAtUtc ?? job.assignedAtUtc;
  }

  if (status === "inprogress") {
    return job.startedAtUtc ?? job.assignedAtUtc;
  }

  return job.assignedAtUtc;
}

function normalizeJobStatus(status: string): JobStatus {
  const normalized = status.trim().toLowerCase();

  if (normalized === "completed") {
    return "completed";
  }

  if (normalized === "inprogress" || normalized === "in progress") {
    return "inprogress";
  }

  return "assigned";
}

function formatBudget(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
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
