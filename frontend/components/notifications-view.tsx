"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuardedPage } from "@/components/guarded-page";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { getErrorMessage } from "@/lib/profile";
import {
  NotificationItem,
  NotificationType,
  createNotificationsHubConnection,
  getNotificationContextText,
  getMyNotifications,
  getNotificationHref,
  getNotificationTypeLabel as getNotificationTypeLabelText,
  getNotificationTypeShortLabel,
  markNotificationRead,
  readAllNotifications
} from "@/lib/notifications";

export function NotificationsView() {
  const router = useRouter();
  const { status, getAccessToken } = useAuth();
  const { locale, t } = useI18n();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [readingAll, setReadingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);
  const visibleItems = useMemo(
    () => (activeFilter === "unread" ? items.filter((item) => !item.isRead) : items),
    [activeFilter, items]
  );
  const groupedItems = useMemo(() => groupNotificationsByDay(visibleItems, t), [visibleItems, t]);

  const loadNotifications = useCallback(async () => {
    if (status !== "authenticated") {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const result = await getMyNotifications(token, { take: 50 });
      setItems(result);
    } catch (loadError) {
      setError(getErrorMessage(loadError, t("notifications.loadError")));
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, router, status, t]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const connection = createNotificationsHubConnection(getAccessToken);

    connection.on("notification.created", (incoming: NotificationItem) => {
      setItems((current) => [incoming, ...current.filter((item) => item.id !== incoming.id)]);
    });

    connection.on("notification.read", (payload: { id: number }) => {
      setItems((current) =>
        current.map((item) => (item.id === payload.id ? { ...item, isRead: true } : item))
      );
    });

    connection.on("notifications.readAll", () => {
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    });

    void connection.start().catch(() => undefined);

    return () => {
      void connection.stop().catch(() => undefined);
    };
  }, [getAccessToken, status]);

  async function handleMarkRead(item: NotificationItem) {
    if (item.isRead) {
      router.push(getNotificationHref(item));
      return;
    }

    setBusyId(item.id);
    setError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      await markNotificationRead(token, item.id);
      setItems((current) =>
        current.map((notification) =>
          notification.id === item.id ? { ...notification, isRead: true } : notification
        )
      );
      router.push(getNotificationHref(item));
    } catch (markError) {
      setError(getErrorMessage(markError, t("notifications.readError")));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReadAll() {
    setReadingAll(true);
    setError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      await readAllNotifications(token);
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (readError) {
      setError(getErrorMessage(readError, t("notifications.readAllError")));
    } finally {
      setReadingAll(false);
    }
  }

  return (
    <GuardedPage
      title={t("notifications.title")}
      description={t("notifications.description")}
    >
      <div className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
        <section className="tasko-card p-0 overflow-hidden">
          <div className="border-b border-[var(--tasko-border)] bg-gradient-to-r from-[#f7faff] via-white to-[#fff8ec] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                  {t("notifications.inbox")}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--tasko-text)]">
                  {t("notifications.recentActivity")}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void handleReadAll()}
                disabled={readingAll || unreadCount === 0}
                className="tasko-primary-btn disabled:opacity-70"
              >
                {readingAll ? t("notifications.updating") : t("notifications.readAll")}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={
                  activeFilter === "all"
                    ? "tasko-primary-btn px-4 py-2"
                    : "tasko-secondary-btn px-4 py-2"
                }
              >
                {t("notifications.all")}
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("unread")}
                className={
                  activeFilter === "unread"
                    ? "tasko-primary-btn px-4 py-2"
                    : "tasko-secondary-btn px-4 py-2"
                }
              >
                {t("notifications.unread")}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mx-6 mt-6 rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="space-y-6 p-6">
            {loading ? (
              <div className="tasko-soft-card p-5 text-sm tasko-muted">{t("notifications.loading")}</div>
            ) : visibleItems.length === 0 ? (
              <div className="tasko-soft-card p-6 text-sm tasko-muted">
                {activeFilter === "unread"
                  ? t("notifications.caughtUp")
                  : t("notifications.empty")}
              </div>
            ) : (
              groupedItems.map((group) => (
                <section key={group.label} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
                      {group.label}
                    </p>
                    <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2f6bff]">
                      {group.items.length}
                    </span>
                    <div className="h-px flex-1 bg-[var(--tasko-border)]" />
                  </div>

                  <div className="space-y-4">
                    {group.items.map((item) => (
                      <article
                        key={item.id}
                        className={`rounded-[1.8rem] border p-5 transition ${
                          item.isRead
                            ? "border-[var(--tasko-border)] bg-white"
                            : "border-[#d8e5ff] bg-[#f6f9ff]"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xs font-semibold uppercase tracking-[0.14em] text-[#35507f] shadow-[0_10px_30px_rgba(44,77,145,0.08)]">
                              {getNotificationTypeShortLabel(item.type)}
                            </div>
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="text-base font-semibold text-[var(--tasko-text)]">
                                  {item.title}
                                </p>
                                {!item.isRead ? (
                                  <span className="rounded-full bg-[#2f6bff] px-3 py-1 text-xs font-semibold text-white">
                                    {t("notifications.new")}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm leading-7 tasko-muted">{item.body}</p>
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2f6bff]">
                                  {getNotificationTypeLabelText(item.type, t)}
                                </span>
                                <span className="text-xs uppercase tracking-[0.18em] text-[#8ba0c3]">
                                  {formatDate(item.createdAtUtc, locale, t)}
                                </span>
                                <span className="text-xs font-medium text-[#59729e]">
                                  {getNotificationContextText(item, t)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Link href={getNotificationHref(item)} className="tasko-secondary-btn">
                              {t("notifications.open")}
                            </Link>
                            <button
                              type="button"
                              onClick={() => void handleMarkRead(item)}
                              disabled={busyId === item.id}
                              className="tasko-primary-btn disabled:opacity-70"
                            >
                              {busyId === item.id
                                ? t("notifications.opening")
                                : item.isRead
                                  ? t("notifications.openItem")
                                  : t("notifications.markRead")}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </section>

        <aside className="grid content-start gap-6">
          <div className="tasko-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
              {t("notifications.summary")}
            </p>
            <div className="mt-4 grid gap-3">
              <NotificationStat label={t("notifications.total")} value={String(items.length)} />
              <NotificationStat label={t("notifications.unread")} value={String(unreadCount)} />
              <NotificationStat
                label={t("notifications.filter")}
                value={activeFilter === "all" ? t("notifications.allItems") : t("notifications.unreadOnly")}
              />
            </div>
          </div>

          <div className="tasko-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">
              {t("notifications.whatArrives")}
            </p>
            <p className="mt-4 text-sm leading-7 tasko-muted">
              {t("notifications.whatArrivesText")}
            </p>
          </div>
        </aside>
      </div>
    </GuardedPage>
  );
}

function NotificationStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f4f7fc] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ba0c3]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--tasko-text)]">{value}</p>
    </div>
  );
}

function getNotificationEmoji(type: NotificationType) {
  if (type === NotificationType.OfferCreated) return "💼";
  if (type === NotificationType.OfferAccepted) return "✅";
  if (type === NotificationType.TaskAssigned) return "🛠";
  if (type === NotificationType.MessageSent) return "💬";
  if (type === NotificationType.TaskPublished) return "📢";
  return "🔔";
}

function getNotificationTypeLabel(type: NotificationType) {
  if (type === NotificationType.OfferCreated) return "Offer";
  if (type === NotificationType.OfferAccepted) return "Offer accepted";
  if (type === NotificationType.TaskAssigned) return "Assignment";
  if (type === NotificationType.MessageSent) return "Message";
  if (type === NotificationType.TaskPublished) return "Marketplace";
  return "Notification";
}

function formatDate(value: string, locale: string, t: (key: string) => string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t("profile.unknown");
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function groupNotificationsByDay(items: NotificationItem[], t: (key: string) => string) {
  const groups = {
    [t("notifications.today")]: [] as NotificationItem[],
    [t("notifications.yesterday")]: [] as NotificationItem[],
    [t("notifications.earlier")]: [] as NotificationItem[]
  };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  for (const item of items) {
    const createdAt = new Date(item.createdAtUtc);

    if (Number.isNaN(createdAt.getTime())) {
      groups[t("notifications.earlier")].push(item);
      continue;
    }

    if (createdAt >= startOfToday) {
      groups[t("notifications.today")].push(item);
      continue;
    }

    if (createdAt >= startOfYesterday) {
      groups[t("notifications.yesterday")].push(item);
      continue;
    }

    groups[t("notifications.earlier")].push(item);
  }

  return Object.entries(groups)
    .filter(([, groupItems]) => groupItems.length > 0)
    .map(([label, groupItems]) => ({ label, items: groupItems }));
}
