"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import {
  NotificationItem,
  createNotificationsHubConnection,
  getNotificationContextText,
  getNotificationHref,
  getNotificationTypeShortLabel
} from "@/lib/notifications";

type ToastNotification = NotificationItem & {
  toastKey: string;
};

const TOAST_TTL_MS = 4500;

export function NotificationsToastLayer() {
  const { status, getAccessToken } = useAuth();
  const { t } = useI18n();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const timeoutMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (status !== "authenticated") {
      setToasts([]);
      clearAllTimeouts(timeoutMapRef.current);
      return;
    }

    const connection = createNotificationsHubConnection(getAccessToken);

    connection.on("notification.created", (incoming: NotificationItem) => {
      const toastKey = `${incoming.id}-${Date.now()}`;

      setToasts((current) => [{ ...incoming, toastKey }, ...current].slice(0, 3));

      const timeoutId = setTimeout(() => {
        setToasts((current) => current.filter((item) => item.toastKey !== toastKey));
        timeoutMapRef.current.delete(toastKey);
      }, TOAST_TTL_MS);

      timeoutMapRef.current.set(toastKey, timeoutId);
    });

    void connection.start().catch(() => undefined);

    return () => {
      void connection.stop().catch(() => undefined);
      clearAllTimeouts(timeoutMapRef.current);
    };
  }, [getAccessToken, status]);

  function dismissToast(toastKey: string) {
    const timeoutId = timeoutMapRef.current.get(toastKey);

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutMapRef.current.delete(toastKey);
    }

    setToasts((current) => current.filter((item) => item.toastKey !== toastKey));
  }

  if (status !== "authenticated" || toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(92vw,24rem)] flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => (
        <div
          key={toast.toastKey}
          className="pointer-events-auto rounded-[1.6rem] border border-[#dbe6ff] bg-white/95 p-4 shadow-[0_22px_60px_rgba(36,67,128,0.18)] backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef4ff] text-xs font-semibold uppercase tracking-[0.16em] text-[#2f6bff]">
              {getNotificationTypeShortLabel(toast.type)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8ba0c3]">
                {t("notifications.newToast")}
              </p>
              <p className="mt-2 line-clamp-2 text-sm font-semibold text-[var(--tasko-text)]">
                {toast.title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 tasko-muted">{toast.body}</p>
              <p className="mt-2 text-xs font-medium text-[#59729e]">
                {getNotificationContextText(toast, t)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={getNotificationHref(toast)} className="tasko-primary-btn px-4 py-2 text-xs">
                  {t("notifications.open")}
                </Link>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.toastKey)}
                  className="tasko-secondary-btn px-4 py-2 text-xs"
                >
                  {t("notifications.dismiss")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function clearAllTimeouts(timeoutMap: Map<string, ReturnType<typeof setTimeout>>) {
  timeoutMap.forEach((timeoutId) => clearTimeout(timeoutId));
  timeoutMap.clear();
}
