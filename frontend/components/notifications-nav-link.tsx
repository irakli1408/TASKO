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

    const connection = createNotificationsHubConnection(getAccessToken);

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

    void connection.start().catch(() => undefined);

    return () => {
      isCancelled = true;
      void connection.stop().catch(() => undefined);
    };
  }, [getAccessToken, status]);

  return (
    <Link href="/notifications" className="tasko-secondary-btn relative px-4 py-2">
      Notifications
      {count > 0 ? (
        <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-[#2f6bff] px-2 py-0.5 text-xs font-semibold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
