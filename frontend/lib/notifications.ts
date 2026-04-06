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
  const offerId = typeof data.offerId === "number" ? data.offerId : null;
  const messageId = typeof data.messageId === "number" ? data.messageId : null;

  if (!taskId) {
    return "/notifications";
  }

  if (notification.type === NotificationType.MessageSent) {
    return `/tasks/${taskId}/chat`;
  }

  if (notification.type === NotificationType.OfferCreated && offerId) {
    return `/tasks/${taskId}`;
  }

  if (notification.type === NotificationType.TaskAssigned) {
    return `/tasks/${taskId}/chat`;
  }

  if (notification.type === NotificationType.OfferAccepted) {
    return `/tasks/${taskId}/chat`;
  }

  if (notification.type === NotificationType.TaskPublished && messageId) {
    return `/tasks/${taskId}`;
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

export function getNotificationTypeLabel(type: NotificationType, t: (key: string) => string) {
  if (type === NotificationType.OfferCreated) return t("notifications.typeOffer");
  if (type === NotificationType.OfferAccepted) return t("notifications.typeOfferAccepted");
  if (type === NotificationType.TaskAssigned) return t("notifications.typeAssignment");
  if (type === NotificationType.MessageSent) return t("notifications.typeMessage");
  if (type === NotificationType.TaskPublished) return t("notifications.typeMarketplace");
  return t("notifications.typeNotification");
}

export function getNotificationTypeShortLabel(type: NotificationType) {
  if (type === NotificationType.OfferCreated) return "OFF";
  if (type === NotificationType.OfferAccepted) return "ACC";
  if (type === NotificationType.TaskAssigned) return "JOB";
  if (type === NotificationType.MessageSent) return "MSG";
  if (type === NotificationType.TaskPublished) return "NEW";
  return "ALT";
}

export function getNotificationContextText(notification: NotificationItem, t: (key: string) => string) {
  const data = parseNotificationData(notification.dataJson);
  const taskId = typeof data.taskId === "number" ? data.taskId : null;

  if (notification.type === NotificationType.MessageSent && taskId) {
    return `${t("notifications.contextMessage")}${taskId}`;
  }

  if (notification.type === NotificationType.TaskAssigned && taskId) {
    return `${t("notifications.contextAssigned")}${taskId}`;
  }

  if (notification.type === NotificationType.OfferCreated && taskId) {
    return `${t("notifications.contextOffers")}${taskId}`;
  }

  if (notification.type === NotificationType.OfferAccepted && taskId) {
    return `${t("notifications.contextContinue")}${taskId}`;
  }

  if (notification.type === NotificationType.TaskPublished && taskId) {
    return `${t("notifications.contextOpenTask")}${taskId}`;
  }

  return t("notifications.contextOpenRelated");
}
