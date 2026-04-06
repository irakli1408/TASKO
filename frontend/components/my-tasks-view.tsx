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
                <article key={task.id} className="tasko-soft-card p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="tasko-pill">{getTaskStatusLabel(task.status, t)}</span>
                        <span className="text-xs uppercase tracking-[0.24em] text-[#8ba0c3]">
                          #{task.id}
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                        {task.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 tasko-muted">
                        {task.description?.trim() || t("myTasks.noDescription")}
                      </p>
                    </div>

                    <div className="grid min-w-[220px] gap-3">
                      <div className="rounded-[1.2rem] bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                          {t("feed.budget")}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">
                          {task.budget !== null ? formatBudget(task.budget, locale) : t("task.notSet")}
                        </p>
                      </div>
                      <div className="rounded-[1.2rem] bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                          {t("myTasks.created")}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">
                          {formatDate(task.createdAtUtc, locale, t)}
                        </p>
                      </div>
                      <div className="rounded-[1.2rem] bg-white px-4 py-3">
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

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={`/tasks/${task.id}`} className="tasko-secondary-btn">
                      {t("myTasks.openDetails")}
                    </Link>
                    <Link href={`/tasks/create?taskId=${task.id}`} className="tasko-secondary-btn">
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
