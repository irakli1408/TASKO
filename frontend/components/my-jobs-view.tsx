"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GuardedPage } from "@/components/guarded-page";
import { useI18n } from "@/components/i18n-provider";

type JobStatus = "assigned" | "inprogress" | "completed";

type MockJob = {
  id: number;
  title: string;
  category: string;
  location: string;
  budget: number;
  status: JobStatus;
  customerName: string;
  startedAt: string;
  description: string;
};

const mockJobs: MockJob[] = [
  {
    id: 41,
    title: "Сборка кухонного шкафа",
    category: "Сборка мебели",
    location: "Сабуртало",
    budget: 220,
    status: "assigned",
    customerName: "Мариам Беридзе",
    startedAt: "2026-04-07T08:30:00Z",
    description: "Нужно собрать верхний кухонный шкаф и закрепить его на стене."
  },
  {
    id: 39,
    title: "Замена розеток в спальне",
    category: "Электрика",
    location: "Ваке",
    budget: 150,
    status: "inprogress",
    customerName: "Иракли Джгереная",
    startedAt: "2026-04-06T15:00:00Z",
    description: "Старые розетки снять, установить новые, проверить работу и безопасность."
  },
  {
    id: 35,
    title: "Выгул собаки на выходных",
    category: "Выгул собак",
    location: "Мтацминда",
    budget: 80,
    status: "completed",
    customerName: "Нино Габуния",
    startedAt: "2026-04-04T09:15:00Z",
    description: "Два выгула в субботу и воскресенье, по 30 минут."
  }
];

export function MyJobsView() {
  const { locale, t } = useI18n();
  const [statusFilter, setStatusFilter] = useState<"all" | JobStatus>("all");

  const filteredJobs = useMemo(() => {
    if (statusFilter === "all") {
      return mockJobs;
    }

    return mockJobs.filter((job) => job.status === statusFilter);
  }, [statusFilter]);

  const stats = useMemo(
    () => ({
      total: mockJobs.length,
      active: mockJobs.filter((job) => job.status === "assigned" || job.status === "inprogress").length,
      completed: mockJobs.filter((job) => job.status === "completed").length
    }),
    []
  );

  return (
    <GuardedPage title={t("myJobs.title")} description={t("myJobs.description")}>
      <div className="grid gap-6">
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
            {filteredJobs.length === 0 ? (
              <div className="tasko-soft-card p-6 text-sm tasko-muted">{t("myJobs.empty")}</div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredJobs.map((job) => (
                  <article
                    key={job.id}
                    className="rounded-[1.8rem] border border-[#dfe7f3] bg-white p-5 shadow-[0_16px_34px_rgba(42,78,148,0.08)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="tasko-pill">#{job.id}</span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getJobTone(
                              job.status
                            )}`}
                          >
                            {getJobStatusLabel(job.status, t)}
                          </span>
                        </div>
                        <h3 className="mt-3 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                          {job.title}
                        </h3>
                        <p className="mt-2 text-sm tasko-muted">{job.customerName}</p>
                      </div>

                      <div className="rounded-[1.25rem] bg-[#f4f7fc] px-4 py-3 text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                          {t("feed.budget")}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-[var(--tasko-text)]">
                          {formatBudget(job.budget, locale)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 tasko-muted">{job.description}</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <JobMetaCard label={t("myJobs.category")} value={job.category} />
                      <JobMetaCard label={t("myJobs.location")} value={job.location} />
                      <JobMetaCard label={t("myJobs.startedAt")} value={formatDate(job.startedAt, locale)} />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link href={`/tasks/${job.id}`} className="tasko-secondary-btn">
                        {t("myJobs.openTask")}
                      </Link>
                      {job.status === "completed" ? (
                        <Link href={`/tasks/${job.id}`} className="tasko-secondary-btn">
                          {t("myJobs.reviewResult")}
                        </Link>
                      ) : (
                        <Link href={`/tasks/${job.id}/chat`} className="tasko-primary-btn">
                          {t("myJobs.openChat")}
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
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
