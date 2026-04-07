export type NotificationPreferenceKey =
  | "offerReceived"
  | "taskAssigned"
  | "messageReceived"
  | "taskCompleted"
  | "marketplaceUpdates";

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

const storageKey = "tasko.settings.notifications";

export const defaultNotificationPreferences: NotificationPreferences = {
  offerReceived: true,
  taskAssigned: true,
  messageReceived: true,
  taskCompleted: true,
  marketplaceUpdates: false
};

export function loadNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") {
    return defaultNotificationPreferences;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return defaultNotificationPreferences;
    }

    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;

    return {
      ...defaultNotificationPreferences,
      ...parsed
    };
  } catch {
    return defaultNotificationPreferences;
  }
}

export function saveNotificationPreferences(preferences: NotificationPreferences) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(preferences));
}
