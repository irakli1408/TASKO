"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { LocationType } from "@/lib/auth";
import { getErrorMessage, getCategories } from "@/lib/profile";
import { getTaskFeed, TaskFeedItem } from "@/lib/tasks";

const locationOptions: { value: LocationType | null; label: string }[] = [
  { value: null, label: "All locations" },
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

export function FeedView() {
  const { status, getAccessToken } = useAuth();
  const [tasks, setTasks] = useState<TaskFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});

  const loadFeed = useCallback(
    async (locationType: LocationType | null, isRefresh = false) => {
      if (status !== "authenticated") {
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const token = await getAccessToken();

        if (!token) {
          setError("You need to log in again.");
          return;
        }

        const [feedItems, categories] = await Promise.all([
          getTaskFeed(token, { take: 24, locationType }),
          getCategories(token)
        ]);

        setTasks(feedItems);
        setCategoryMap(
          Object.fromEntries(categories.map((category) => [category.id, category.name]))
        );
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
            "Could not load the executor feed right now."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getAccessToken, status]
  );

  useEffect(() => {
    void loadFeed(selectedLocation);
  }, [loadFeed, selectedLocation]);

  const stats = useMemo(() => {
    const visibleBudgetCount = tasks.filter((task) => task.budget !== null).length;
    const latestCreatedAt = tasks[0]?.createdAtUtc ?? null;
    const newestTask = tasks[0] ?? null;

    return {
      total: tasks.length,
      visibleBudgetCount,
      latestCreatedAt,
      newestTask
    };
  }, [tasks]);

  return (
    <GuardedPage
      title="Executor feed"
      description="Fresh published tasks for active executors, with a responsive layout that stays comfortable on phones, tablets and desktop."
      requireExecutor
    >
      <section className="grid gap-6">
        <section className="grid gap-6 xl:grid-cols-[1.28fr_0.72fr]">
          <article className="tasko-card overflow-hidden p-0">
            <div className="grid gap-6 bg-gradient-to-r from-[#f7faff] via-white to-[#fff8ec] p-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <span className="tasko-pill">Executor dashboard</span>
                <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-[var(--tasko-text)] sm:text-4xl">
                  Choose a task that matches your category and working area.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 tasko-muted">
                  This feed is tailored by your executor settings. Filter by district, review task cards,
                  and jump directly into the details page when a job fits your profile.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void loadFeed(selectedLocation, true)}
                    disabled={refreshing}
                    className="tasko-primary-btn disabled:opacity-70"
                  >
                    {refreshing ? "Refreshing..." : "Refresh feed"}
                  </button>
                  <Link href="/profile" className="tasko-secondary-btn">
                    Update executor settings
                  </Link>
                </div>
              </div>

              <div className="tasko-soft-card flex flex-col justify-between p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                    Recommended now
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight text-[var(--tasko-text)]">
                    {stats.newestTask?.title ?? "No new tasks yet"}
                  </h3>
                  <p className="mt-3 text-sm leading-7 tasko-muted">
                    {stats.newestTask?.description?.trim() ||
                      "As soon as a matching task appears, the latest one will be highlighted here."}
                  </p>
                </div>

                <div className="mt-6 grid gap-3">
                  <QuickStat label="Visible tasks" value={String(stats.total)} />
                  <QuickStat label="Tasks with budget" value={String(stats.visibleBudgetCount)} />
                  <QuickStat
                    label="Latest task"
                    value={stats.latestCreatedAt ? formatRelativeDate(stats.latestCreatedAt) : "No tasks"}
                  />
                </div>
              </div>
            </div>
          </article>

          <article className="tasko-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
              Filters
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
              Refine the feed
            </h3>

            <label className="mt-5 block space-y-2">
              <span className="tasko-label">Location filter</span>
              <select
                value={selectedLocation ?? ""}
                onChange={(event) =>
                  setSelectedLocation(
                    event.target.value ? (Number(event.target.value) as LocationType) : null
                  )
                }
                className="tasko-input"
              >
                {locationOptions.map((option) => (
                  <option key={String(option.value)} value={option.value ?? ""}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5 flex flex-wrap gap-2">
              {locationOptions.slice(0, 6).map((option) => {
                const active = selectedLocation === option.value;

                return (
                  <button
                    key={`quick-${String(option.value)}`}
                    type="button"
                    onClick={() => setSelectedLocation(option.value)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "bg-[#2f6bff] text-white"
                        : "border border-[#dfe7f3] bg-white text-[#607392] hover:bg-[#f6f9ff]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-3">
              <StatCard label="Visible tasks" value={String(stats.total)} compact />
              <StatCard label="With budget" value={String(stats.visibleBudgetCount)} compact />
            </div>
          </article>
        </section>

        {error ? (
          <div className="rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <article key={index} className="tasko-card p-6">
                <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-5 h-7 w-3/4 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-4 space-y-3">
                  <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
                  <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-200" />
                </div>
              </article>
            ))}
          </section>
        ) : tasks.length === 0 ? (
          <section className="tasko-card p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
              Feed is empty
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              No tasks match your current executor setup
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 tasko-muted">
              This usually means there are no published tasks in your categories or locations yet.
              If you just activated executor mode, check your profile categories and working areas.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/profile" className="tasko-primary-btn">
                Adjust profile settings
              </Link>
              <button
                type="button"
                onClick={() => void loadFeed(selectedLocation, true)}
                className="tasko-secondary-btn"
              >
                Try refresh
              </button>
            </div>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[0.78fr_0.22fr]">
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {tasks.map((task, index) => (
                <article key={task.id} className="tasko-card flex h-full flex-col p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                        {categoryMap[task.categoryId] ?? `Category #${task.categoryId}`}
                      </p>
                      <h2 className="text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                        {task.title}
                      </h2>
                    </div>
                    <span className="rounded-full bg-[#edf3ff] px-3 py-2 text-xs font-semibold text-[#2f6bff]">
                      {getLocationLabel(task.locationType)}
                    </span>
                  </div>

                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2f6bff] text-sm font-semibold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--tasko-text)]">New request</p>
                      <p className="text-xs tasko-muted">{formatRelativeDate(task.createdAtUtc)}</p>
                    </div>
                  </div>

                  <p className="min-h-20 text-sm leading-7 tasko-muted">
                    {task.description?.trim() || "No description was provided for this task yet."}
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <InfoPill
                      label="Budget"
                      value={task.budget !== null ? formatBudget(task.budget) : "Not specified"}
                    />
                    <InfoPill label="Published" value={formatRelativeDate(task.createdAtUtc)} />
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <span className="text-sm tasko-muted">Task #{task.id}</span>
                    <Link href={`/tasks/${task.id}`} className="tasko-primary-btn px-4 py-2">
                      Open details
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <aside className="grid content-start gap-5">
              <div className="tasko-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  Feed tips
                </p>
                <div className="mt-4 space-y-4">
                  {[
                    "Use the location filter to reduce noise and focus on nearby requests.",
                    "Tasks with a visible budget are easier to estimate and answer quickly.",
                    "Open details to review offers, stats and photos before responding."
                  ].map((tip) => (
                    <div key={tip} className="tasko-soft-card p-4">
                      <p className="text-sm leading-7 tasko-muted">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="tasko-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  Quick actions
                </p>
                <div className="mt-4 grid gap-3">
                  <Link href="/profile" className="tasko-secondary-btn w-full">
                    Open profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => void loadFeed(selectedLocation, true)}
                    className="tasko-primary-btn w-full"
                  >
                    Refresh tasks
                  </button>
                </div>
              </div>
            </aside>
          </section>
        )}
      </section>
    </GuardedPage>
  );
}

function StatCard({
  label,
  value,
  compact = false
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`tasko-card ${compact ? "p-4" : "p-5"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">{label}</p>
      <p className={`font-semibold tracking-tight ${compact ? "mt-2 text-xl" : "mt-3 text-2xl"}`}>
        {value}
      </p>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
      <span className="text-sm tasko-muted">{label}</span>
      <span className="text-sm font-semibold text-[var(--tasko-text)]">{value}</span>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="tasko-soft-card px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
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

function formatRelativeDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getLocationLabel(locationType: LocationType) {
  return (
    locationOptions.find((option) => option.value === locationType)?.label ??
    `Location #${locationType}`
  );
}
