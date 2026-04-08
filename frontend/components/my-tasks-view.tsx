"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { getErrorMessage } from "@/lib/profile";
import { TaskRecord, getMyTasks } from "@/lib/tasks";

export function MyTasksView() {
  const { getAccessToken } = useAuth();
  const { locale, t } = useI18n();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error(t("createTask.notAuthenticated"));
      }

      const result = await getMyTasks(token);
      setTasks(result);
    } catch (loadError) {
      setError(getErrorMessage(loadError, t("myTasks.loadError")));
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, t]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      drafts: tasks.filter((task) => task.status.toLowerCase() === "draft").length,
      published: tasks.filter((task) => task.status.toLowerCase() === "published").length
    };
  }, [tasks]);

  return (
    <GuardedPage
      title={t("myTasks.title")}
      description={t("myTasks.description")}
    >
      <div className="grid gap-6">
        {error ? (
          <div className="rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label={t("myTasks.allTasks")} value={String(stats.total)} />
          <StatCard label={t("myTasks.drafts")} value={String(stats.drafts)} />
          <StatCard label={t("myTasks.published")} value={String(stats.published)} />
        </section>

        <section className="tasko-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                {t("myTasks.workspace")}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                {t("myTasks.createdTasks")}
              </h2>
            </div>
            <Link href="/tasks/create" className="tasko-primary-btn">
              {t("myTasks.newTask")}
            </Link>
          </div>

          {loading ? (
            <div className="tasko-soft-card mt-5 p-5 text-sm tasko-muted">{t("myTasks.loading")}</div>
          ) : tasks.length === 0 ? (
            <div className="tasko-soft-card mt-5 p-5 text-sm tasko-muted">
              {t("myTasks.empty")}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {tasks.map((task) => (
                <article key={task.id} className={`tasko-soft-card rounded-[1.8rem] p-4 ${getTaskToneClass(task.status)}`}>
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_228px]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="tasko-pill">{getTaskStatusLabel(task.status, t)}</span>
                      </div>
                      <h3 className="mt-2.5 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                        {task.title}
                      </h3>
                      <p className="mt-2 max-w-3xl text-sm leading-6.5 tasko-muted">
                        {task.description?.trim() || t("myTasks.noDescription")}
                      </p>

                      {isTaskExpiredByPreferredTime(task) ? (
                        <div className="mt-4 inline-flex max-w-3xl rounded-full border border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.10)] px-4 py-2 text-sm font-semibold text-[#9a6700]">
                          {t("myTasks.expiredByTime")}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-[1.4rem] border border-[rgba(59,130,246,0.14)] bg-[rgba(59,130,246,0.07)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                          {t("feed.budget")}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">
                          {task.budget !== null ? formatBudget(task.budget, locale) : t("task.notSet")}
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border border-[rgba(59,130,246,0.14)] bg-[rgba(59,130,246,0.07)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                          {t("task.preferredTime")}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">
                          {task.preferredTime?.trim() || t("task.notSet")}
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border border-[rgba(34,197,94,0.14)] bg-[rgba(34,197,94,0.07)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                          {t("myTasks.created")}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">
                          {formatDate(task.createdAtUtc, locale, t)}
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border border-[rgba(245,158,11,0.14)] bg-[rgba(245,158,11,0.08)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                          {t("myTasks.assignedExecutor")}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">
                          {task.assignedToUserId
                            ? formatParticipantName(
                                task.assignedToFirstName,
                                task.assignedToLastName,
                                task.assignedToUserId
                              )
                            : t("myTasks.notAssigned")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap gap-2.5 border-t border-[rgba(148,163,184,0.14)] pt-3.5">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-[#d9e4f5] bg-[#fbfdff] px-4 text-[13px] font-semibold text-[#17325c] transition hover:border-[#bfd4f4] hover:bg-[#f4f8ff]"
                    >
                      {t("myTasks.openDetails")}
                    </Link>
                    <Link
                      href={`/tasks/create?taskId=${task.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-[#dbe7ff] bg-[#eef4ff] px-4 text-[13px] font-semibold text-[#2563eb] transition hover:bg-[#e5efff]"
                    >
                      {t("myTasks.continueEditing")}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </GuardedPage>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="tasko-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--tasko-text)]">{value}</p>
    </div>
  );
}

function formatBudget(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string, locale: string, t: (key: string) => string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t("profile.unknown");
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatParticipantName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  userId: number
) {
  const fullName = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");

  if (fullName) {
    return fullName;
  }

  return `User #${userId}`;
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

function getTaskToneClass(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "draft") {
    return "border-[rgba(59,130,246,0.16)] bg-[rgba(59,130,246,0.055)]";
  }

  if (normalized === "published") {
    return "border-[rgba(34,197,94,0.16)] bg-[rgba(34,197,94,0.055)]";
  }

  if (normalized === "assigned") {
    return "border-[rgba(245,158,11,0.16)] bg-[rgba(245,158,11,0.06)]";
  }

  if (normalized === "inprogress" || normalized === "in progress") {
    return "border-[rgba(99,102,241,0.16)] bg-[rgba(99,102,241,0.06)]";
  }

  if (normalized === "completed") {
    return "border-[rgba(34,197,94,0.16)] bg-[rgba(34,197,94,0.06)]";
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "border-[rgba(239,68,68,0.16)] bg-[rgba(239,68,68,0.055)]";
  }

  return "";
}

function isTaskExpiredByPreferredTime(task: TaskRecord) {
  const normalizedStatus = task.status.trim().toLowerCase();

  if (normalizedStatus !== "published") {
    return false;
  }

  const preferredTime = parsePreferredTime(task.preferredTime);

  if (!preferredTime) {
    return false;
  }

  const referenceDate = new Date(task.publishedAtUtc ?? task.createdAtUtc);

  if (Number.isNaN(referenceDate.getTime())) {
    return false;
  }

  const deadline = new Date(referenceDate);
  deadline.setHours(preferredTime.hours, preferredTime.minutes, 0, 0);
  deadline.setHours(deadline.getHours() + 3);

  return Date.now() > deadline.getTime();
}

function parsePreferredTime(value: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}
