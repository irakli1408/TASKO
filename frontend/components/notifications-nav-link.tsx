"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import {
  createNotificationsHubConnection,
  getNotificationsUnreadCount
} from "@/lib/notifications";

export function NotificationsNavLink() {
  const { status, getAccessToken } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") {
      setCount(0);
      return;
    }

    let isCancelled = false;
    const connection = createNotificationsHubConnection(getAccessToken);
    const startPromise = connection.start().catch(() => undefined);

    async function bootstrap() {
      const token = await getAccessToken();

      if (!token || isCancelled) {
        return;
      }

      const unread = await getNotificationsUnreadCount(token).catch(() => ({ count: 0 }));

      if (!isCancelled) {
        setCount(unread.count);
      }
    }

    void bootstrap();

    connection.on("notifications.unreadCount", (payload: { count: number }) => {
      setCount(payload.count ?? 0);
    });

    connection.on("notification.created", () => {
      setCount((current) => current + 1);
    });

    connection.on("notification.read", () => {
      setCount((current) => Math.max(0, current - 1));
    });

    connection.on("notifications.readAll", () => {
      setCount(0);
    });

    return () => {
      isCancelled = true;
      void startPromise.finally(() => {
        void connection.stop().catch(() => undefined);
      });
    };
  }, [getAccessToken, status]);

  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--tasko-border)] bg-white text-[#56657d] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-[16px] w-[16px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
        <path d="M10 17a2 2 0 0 0 4 0" />
      </svg>
      {count > 0 ? (
        <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#22C55E] px-1 text-[9px] font-semibold leading-none text-white shadow-[0_8px_18px_rgba(34,197,94,0.26)]">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
