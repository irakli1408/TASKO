"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { LocationType } from "@/lib/auth";
import { CategoryTree, getCategoryTree, getErrorMessage, getCategories } from "@/lib/profile";
import { getRespondedTaskIds } from "@/lib/responded-tasks";
import { getTaskFeed, TaskFeedItem } from "@/lib/tasks";

export function FeedView() {
  const { status, getAccessToken } = useAuth();
  const { locale, t } = useI18n();
  const [tasks, setTasks] = useState<TaskFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});
  const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([]);
  const [respondedTaskIds, setRespondedTaskIds] = useState<number[]>([]);
  const [selectedRootCategoryId, setSelectedRootCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const locationOptions = useMemo<{ value: LocationType | null; label: string }[]>(
    () => [
      { value: null, label: t("location.allLocations") },
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
          setError(t("feed.needLogin"));
          return;
        }

        const [feedItems, categories, categoriesTree] = await Promise.all([
          getTaskFeed(token, { take: 24, locationType }),
          getCategories(token),
          getCategoryTree(token).catch(() => [])
        ]);

        setTasks(feedItems);
        setCategoryMap(
          Object.fromEntries(categories.map((category) => [category.id, category.name]))
        );
        setCategoryTree(categoriesTree);
      } catch (loadError) {
        setError(getErrorMessage(loadError, t("feed.loadError")));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getAccessToken, status, t]
  );

  useEffect(() => {
    void loadFeed(selectedLocation);
  }, [loadFeed, selectedLocation]);

  useEffect(() => {
    const syncRespondedTasks = () => setRespondedTaskIds(getRespondedTaskIds());

    syncRespondedTasks();
    window.addEventListener("storage", syncRespondedTasks);
    window.addEventListener("focus", syncRespondedTasks);

    return () => {
      window.removeEventListener("storage", syncRespondedTasks);
      window.removeEventListener("focus", syncRespondedTasks);
    };
  }, []);

  const rootCategoryButtons = useMemo(
    () => [{ id: null, name: "Все категории" }, ...categoryTree.filter((item) => item.children.length > 0)],
    [categoryTree]
  );

  const selectedRootCategory = useMemo(
    () => categoryTree.find((item) => item.id === selectedRootCategoryId) ?? null,
    [categoryTree, selectedRootCategoryId]
  );

  const selectedCategoryIds = useMemo(() => {
    if (selectedSubcategoryId !== null) {
      return new Set([selectedSubcategoryId]);
    }

    if (selectedRootCategoryId === null) {
      return null;
    }

    if (!selectedRootCategory) {
      return null;
    }

    return new Set(selectedRootCategory.children.map((child) => child.id));
  }, [selectedRootCategory, selectedRootCategoryId, selectedSubcategoryId]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesCategory =
        !selectedCategoryIds || selectedCategoryIds.has(task.categoryId);

      const categoryName = categoryMap[task.categoryId] ?? "";
      const haystack = `${task.title} ${task.description ?? ""} ${categoryName}`.toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [categoryMap, searchQuery, selectedCategoryIds, tasks]);

  const stats = useMemo(() => {
    const visibleBudgetCount = filteredTasks.filter((task) => task.budget !== null).length;

    return {
      total: filteredTasks.length,
      visibleBudgetCount
    };
  }, [filteredTasks]);

  return (
    <GuardedPage title={t("feed.title")} description={t("feed.description")} requireExecutor>
      <section className="grid gap-6">
        <section className="tasko-card overflow-hidden p-0">
          <div className="border-b border-[var(--tasko-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8BA0C3]">
                  Лента заказов
                </p>
                <h2 className="mt-2 text-[2rem] font-semibold tracking-tight text-[var(--tasko-text)] sm:text-[2.35rem]">
                  {stats.total} задач доступно в вашей зоне
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void loadFeed(selectedLocation, true)}
                  disabled={refreshing}
                  className="tasko-primary-btn px-5 py-3 disabled:opacity-70"
                >
                  {refreshing ? t("feed.refreshing") : t("feed.refresh")}
                </button>
                <Link href="/profile" className="tasko-secondary-btn px-5 py-3">
                  {t("feed.updateSettings")}
                </Link>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_150px]">
              <div className="tasko-input flex min-h-[46px] items-center px-4 text-sm text-[var(--tasko-muted)]">
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Найти задачу или категорию..."
                  className="w-full bg-transparent text-sm text-[var(--tasko-text)] outline-none placeholder:text-[var(--tasko-muted)]"
                />
              </div>
              <select
                value={selectedLocation ?? ""}
                onChange={(event) =>
                  setSelectedLocation(
                    event.target.value ? (Number(event.target.value) as LocationType) : null
                  )
                }
                className="tasko-input min-h-[46px]"
              >
                {locationOptions.map((option) => (
                  <option key={String(option.value)} value={option.value ?? ""}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="flex min-h-[46px] items-center justify-center rounded-[12px] border border-[var(--tasko-border)] bg-white px-4 text-sm font-semibold text-[var(--tasko-text)]">
                {stats.visibleBudgetCount} с бюджетом
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="tasko-soft-card h-fit p-5">
              <p className="text-sm font-semibold text-[var(--tasko-text)]">Фильтры</p>
              <div className="mt-5 space-y-2">
                {rootCategoryButtons.map((item) => {
                  const active =
                    (item.id === null && selectedRootCategoryId === null) ||
                    item.id === selectedRootCategoryId;

                  return (
                  <button
                    key={item.id ?? "all"}
                    type="button"
                    onClick={() => {
                      setSelectedRootCategoryId(item.id);
                      setSelectedSubcategoryId(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-[12px] px-4 py-3 text-left text-sm font-medium transition ${
                      active
                        ? "bg-[#3B82F6] text-white"
                        : "bg-white text-[var(--tasko-text)] hover:bg-[#f5f9ff]"
                    }`}
                  >
                    <span>{item.name}</span>
                  </button>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-[var(--tasko-border)] pt-6">
                <p className="text-sm font-semibold text-[var(--tasko-text)]">Быстрые зоны</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {locationOptions.slice(1, 6).map((option) => {
                    const active = selectedLocation === option.value;

                    return (
                      <button
                        key={`quick-${String(option.value)}`}
                        type="button"
                        onClick={() => setSelectedLocation(option.value)}
                        className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                          active
                            ? "bg-[#3B82F6] text-white"
                            : "border border-[var(--tasko-border)] bg-white text-[var(--tasko-text)]"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div>
              {error ? (
                <div className="mb-5 rounded-[16px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {selectedRootCategory ? (
                <section className="mb-5 rounded-[22px] border border-[var(--tasko-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                        Подкатегории
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--tasko-text)]">
                        {selectedRootCategory.name}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--tasko-muted)]">
                        Уточни направление, чтобы быстрее увидеть самые подходящие заказы в этой категории.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSubcategoryId(null)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        selectedSubcategoryId === null
                          ? "bg-[#3B82F6] text-white"
                          : "border border-[var(--tasko-border)] bg-white text-[var(--tasko-text)] hover:bg-[#f5f9ff]"
                      }`}
                    >
                      Все подкатегории
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {selectedRootCategory.children.map((child) => {
                      const active = selectedSubcategoryId === child.id;

                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => setSelectedSubcategoryId(child.id)}
                          className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                            active
                              ? "bg-[#eaf2ff] text-[#2563eb] ring-1 ring-[#cfe0ff]"
                              : "border border-[var(--tasko-border)] bg-white text-[var(--tasko-text)] hover:bg-[#f5f9ff]"
                          }`}
                        >
                          {child.name}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {loading ? (
                <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <article key={index} className="tasko-card overflow-hidden p-0">
                      <div className="h-44 animate-pulse bg-slate-200" />
                      <div className="p-5">
                        <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                        <div className="mt-4 h-7 w-3/4 animate-pulse rounded-full bg-slate-200" />
                        <div className="mt-4 space-y-3">
                          <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
                          <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-200" />
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              ) : filteredTasks.length === 0 ? (
                <section className="tasko-card p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                    {t("feed.empty")}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight">{t("feed.emptyTitle")}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--tasko-muted)]">
                    {t("feed.emptyText")}
                  </p>
                </section>
              ) : (
                <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {filteredTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      locale={locale}
                      categoryName={categoryMap[task.categoryId] ?? `Category #${task.categoryId}`}
                      locationLabel={getLocationLabel(task.locationType, locationOptions, t)}
                      responded={respondedTaskIds.includes(task.id)}
                      t={t}
                    />
                  ))}
                </section>
              )}
            </div>
          </div>
        </section>
      </section>
    </GuardedPage>
  );
}

function TaskCard({
  task,
  index,
  locale,
  categoryName,
  locationLabel,
  responded,
  t
}: {
  task: TaskFeedItem;
  index: number;
  locale: string;
  categoryName: string;
  locationLabel: string;
  responded: boolean;
  t: (key: string) => string;
}) {
  const visual = getTaskVisual(index);

  return (
    <article className="tasko-card flex h-full flex-col overflow-hidden p-0">
      <div className={`relative h-44 ${visual.bannerClass} p-4 text-white`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.34),transparent_34%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <span className="rounded-full bg-white/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/92 backdrop-blur-sm">
            {categoryName}
          </span>
          <span className="rounded-full bg-white/12 px-3 py-1 text-[10px] font-semibold text-white/92 backdrop-blur-sm">
            {locationLabel}
          </span>
        </div>
        <div className="relative mt-5 max-w-[240px]">
          <p className="text-[1.45rem] font-semibold leading-tight">{task.title}</p>
        </div>
        <div className="relative mt-3 flex items-center gap-2 text-[11px] font-medium text-white/85">
          {responded ? <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[#166534]">Отклик уже отправлен</span> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-3 text-xs text-[var(--tasko-muted)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef4ff] text-sm font-semibold text-[#2563eb]">
            {getInitials(task.createdByFirstName, task.createdByLastName)}
          </div>
          <div>
            <p className="font-semibold text-[var(--tasko-text)]">
              {formatPersonName(task.createdByFirstName, task.createdByLastName, task.createdByUserId)}
            </p>
            <p className="mt-0.5">{formatRelativeDate(task.publishedAtUtc ?? task.createdAtUtc, locale)}</p>
          </div>
        </div>

        <p className="mt-3 min-h-[56px] text-sm leading-6 text-[var(--tasko-muted)]">
          {task.description?.trim() ||
            "Исполнитель увидит описание задачи, бюджет и сможет отправить свое предложение."}
        </p>

        <div className="mt-3 min-h-[36px]">
          {task.preferredTime?.trim() ? (
            <div className="inline-flex rounded-full border border-[rgba(59,130,246,0.14)] bg-[rgba(59,130,246,0.07)] px-3 py-1.5 text-xs font-semibold text-[#315294]">
              {t("task.preferredTime")}: {task.preferredTime}
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-[18px] bg-[#f8fbff] p-3">
          <div className="rounded-[14px] bg-white px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8BA0C3]">Бюджет</p>
            <p className="mt-1 text-xl font-semibold text-[var(--tasko-text)]">
              {task.budget !== null ? formatBudget(task.budget, locale) : "Не указан"}
            </p>
          </div>
          <div className="rounded-[14px] bg-white px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8BA0C3]">Статус</p>
            <p className="mt-1 text-sm font-semibold text-[var(--tasko-text)]">Опубликовано</p>
          </div>
        </div>

        <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
          <Link
            href={`/tasks/${task.id}`}
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full border border-[#d9e4f5] bg-[#fbfdff] px-4 text-center text-[13px] font-semibold text-[#17325c] transition hover:border-[#bfd4f4] hover:bg-[#f4f8ff]"
          >
            Открыть детали
          </Link>
          <Link
            href={`/tasks/${task.id}`}
            className={`inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full px-4 text-center text-[13px] font-semibold transition ${
              responded
                ? "border border-[#cdeedd] bg-[#eef9f0] text-[#23915d] hover:bg-[#e6f6ea]"
                : "bg-[linear-gradient(180deg,#34d399_0%,#22c55e_100%)] text-white shadow-[0_10px_20px_rgba(34,197,94,0.16)] hover:brightness-[0.98]"
            }`}
          >
            {responded ? t("feed.responded") : t("feed.respond")}
          </Link>
        </div>
      </div>
    </article>
  );
}

function getTaskVisual(index: number) {
  const variants = [
    "bg-[linear-gradient(135deg,rgba(96,165,250,0.92)_0%,rgba(59,130,246,0.82)_48%,rgba(37,99,235,0.92)_100%)]",
    "bg-[linear-gradient(135deg,#34D399_0%,#10B981_100%)]",
    "bg-[linear-gradient(135deg,#A78BFA_0%,#8B5CF6_100%)]",
    "bg-[linear-gradient(135deg,#F59E0B_0%,#FB7185_100%)]"
  ];

  return {
    bannerClass: variants[index % variants.length]
  };
}

function formatBudget(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatRelativeDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Недавно";
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getLocationLabel(
  locationType: LocationType,
  locationOptions: { value: LocationType | null; label: string }[],
  t: (key: string) => string
) {
  return (
    locationOptions.find((option) => option.value === locationType)?.label ??
    `${t("profile.mainLocation")} #${locationType}`
  );
}

function formatPersonName(
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

function getInitials(firstName: string | null | undefined, lastName: string | null | undefined) {
  const initials = `${firstName?.trim()?.[0] ?? ""}${lastName?.trim()?.[0] ?? ""}`.trim();
  return initials || "TK";
}

