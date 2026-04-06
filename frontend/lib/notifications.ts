import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { apiFetch, buildHubUrl } from "@/lib/api";

export enum NotificationType {
  OfferCreated = 1,
  OfferAccepted = 2,
  TaskAssigned = 3,
  MessageSent = 4,
  TaskPublished = 5
}

export type NotificationItem = {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  dataJson: string | null;
  isRead: boolean;
  createdAtUtc: string;
};

export type NotificationsUnreadCount = {
  count: number;
};

export async function getMyNotifications(
  token: string,
  options: { skip?: number; take?: number } = {}
) {
  const query = new URLSearchParams();

  if (options.skip !== undefined) {
    query.set("skip", String(options.skip));
  }

  if (options.take !== undefined) {
    query.set("take", String(options.take));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiFetch<NotificationItem[]>(`/Notifications${suffix}`, {
    token
  });
}

export async function getNotificationsUnreadCount(token: string) {
  return apiFetch<NotificationsUnreadCount>("/Notifications/unread-count", {
    token
  });
}

export async function markNotificationRead(token: string, id: number) {
  return apiFetch<void>(`/Notifications/${id}/read`, {
    method: "POST",
    token
  });
}

export async function readAllNotifications(token: string) {
  return apiFetch<void>("/Notifications/read-all", {
    method: "POST",
    token
  });
}

export function createNotificationsHubConnection(getAccessToken: () => Promise<string | null>) {
  return new HubConnectionBuilder()
    .withUrl(buildHubUrl("/hubs/notifications"), {
      accessTokenFactory: async () => (await getAccessToken()) ?? ""
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Error)
    .build();
}

export function getNotificationHref(notification: NotificationItem) {
  const data = parseNotificationData(notification.dataJson);
  const taskId = typeof data.taskId === "number" ? data.taskId : null;

  if (!taskId) {
    return "/notifications";
  }

  if (notification.type === NotificationType.MessageSent) {
    return `/tasks/${taskId}/chat`;
  }

  return `/tasks/${taskId}`;
}

export function parseNotificationData(dataJson: string | null) {
  if (!dataJson) {
    return {};
  }

  try {
    const parsed = JSON.parse(dataJson) as Record<string, unknown>;
    return parsed ?? {};
  } catch {
    return {};
  }
}
