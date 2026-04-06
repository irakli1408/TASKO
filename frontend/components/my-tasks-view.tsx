"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { getErrorMessage } from "@/lib/profile";
import { TaskRecord, getMyTasks } from "@/lib/tasks";

export function MyTasksView() {
  const { getAccessToken } = useAuth();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      const result = await getMyTasks(token);
      setTasks(result);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load your tasks."));
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

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
      title="My tasks"
      description="See all tasks you created, keep track of drafts, and continue editing or reviewing details."
    >
      <div className="grid gap-6">
        {error ? (
          <div className="rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="All tasks" value={String(stats.total)} />
          <StatCard label="Drafts" value={String(stats.drafts)} />
          <StatCard label="Published" value={String(stats.published)} />
        </section>

        <section className="tasko-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                Customer workspace
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                Created tasks
              </h2>
            </div>
            <Link href="/tasks/create" className="tasko-primary-btn">
              New task
            </Link>
          </div>

          {loading ? (
            <div className="tasko-soft-card mt-5 p-5 text-sm tasko-muted">Loading your tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="tasko-soft-card mt-5 p-5 text-sm tasko-muted">
              You have not created any tasks yet.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {tasks.map((task) => (
                <article key={task.id} className="tasko-soft-card p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="tasko-pill">{task.status}</span>
                        <span className="text-xs uppercase tracking-[0.24em] text-[#8ba0c3]">
                          #{task.id}
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                        {task.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 tasko-muted">
                        {task.description?.trim() || "No description added yet."}
                      </p>
                    </div>

                    <div className="grid min-w-[220px] gap-3">
                      <div className="rounded-[1.2rem] bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                          Budget
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">
                          {task.budget !== null ? formatBudget(task.budget) : "Not set"}
                        </p>
                      </div>
                      <div className="rounded-[1.2rem] bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                          Created
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">
                          {formatDate(task.createdAtUtc)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={`/tasks/${task.id}`} className="tasko-secondary-btn">
                      Open details
                    </Link>
                    <Link href={`/tasks/create?taskId=${task.id}`} className="tasko-secondary-btn">
                      Continue editing
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

function formatBudget(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}
