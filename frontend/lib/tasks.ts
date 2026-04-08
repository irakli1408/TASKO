import { apiFetch } from "@/lib/api";
import { LocationType } from "@/lib/auth";

export type TaskFeedItem = {
  id: number;
  createdByUserId: number;
  createdByFirstName: string;
  createdByLastName: string;
  title: string;
  description: string | null;
  budget: number | null;
  preferredTime: string | null;
  categoryId: number;
  locationType: LocationType;
  createdAtUtc: string;
  publishedAtUtc?: string | null;
};

export type TaskRecord = {
  id: number;
  createdByUserId: number;
  assignedToUserId: number | null;
  assignedToFirstName: string | null;
  assignedToLastName: string | null;
  title: string;
  description: string | null;
  budget: number | null;
  preferredTime: string | null;
  categoryId: number;
  locationType: LocationType;
  status: string;
  createdAtUtc: string;
  publishedAtUtc: string | null;
};

export type TaskDetails = {
  id: number;
  createdByUserId: number;
  assignedToUserId: number | null;
  createdByFirstName: string;
  createdByLastName: string;
  assignedToFirstName: string | null;
  assignedToLastName: string | null;
  title: string;
  description: string;
  budget: number | null;
  preferredTime: string | null;
  status: number;
  createdAtUtc: string;
  viewsCount: number;
  review: TaskReview | null;
};

export type TaskStats = {
  taskId: number;
  offersCount: number;
  activeOffersCount: number;
  acceptedOffersCount: number;
  viewsCount: number;
};

export type TaskOffer = {
  id: number;
  taskId: number;
  executorUserId: number;
  executorFirstName: string;
  executorLastName: string;
  executorAvatarUrl: string | null;
  executorExperienceYears: number | null;
  executorLocationType: LocationType;
  executorRatingAverage: number;
  executorRatingCount: number;
  price: number;
  comment: string | null;
  status: string;
  createdAtUtc: string;
};

export type MyOfferItem = {
  offerId: number;
  taskId: number;
  taskTitle: string;
  taskDescription: string | null;
  price: number;
  status: string;
  categoryId: number;
  categoryName: string;
  locationType: LocationType;
  customerName: string;
  createdAtUtc: string;
};

export type MyJobItem = {
  taskId: number;
  taskTitle: string;
  taskDescription: string | null;
  budget: number | null;
  preferredTime: string | null;
  status: string;
  categoryId: number;
  categoryName: string;
  locationType: LocationType;
  customerName: string;
  assignedAtUtc: string | null;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
};

export type TaskImage = {
  fileId: number;
  url: string;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
  createdAtUtc: string;
};

export type ChatMessage = {
  id: number;
  taskId: number;
  senderUserId: number;
  senderFirstName: string;
  senderLastName: string;
  text: string;
  createdAtUtc: string;
};

export type TaskReview = {
  id: number;
  taskId: number;
  fromUserId: number;
  toUserId: number;
  score: number;
  comment: string | null;
  createdAtUtc: string;
};

export type UnreadCount = {
  count: number;
};

export type CreateTaskPayload = {
  title: string;
  description: string | null;
  budget: number | null;
  preferredTime: string | null;
  categoryId: number;
  locationType: LocationType;
};

export type UpdateTaskPayload = {
  title?: string | null;
  description?: string | null;
  budget?: number | null;
  preferredTime?: string | null;
  categoryId?: number | null;
  locationType?: LocationType | null;
};

export async function getTaskFeed(
  token: string,
  options: { skip?: number; take?: number; locationType?: LocationType | null } = {}
) {
  const query = new URLSearchParams();

  if (options.skip !== undefined) {
    query.set("skip", String(options.skip));
  }

  if (options.take !== undefined) {
    query.set("take", String(options.take));
  }

  if (options.locationType !== undefined && options.locationType !== null) {
    query.set("locationType", String(options.locationType));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiFetch<TaskFeedItem[]>(`/Tasks/feed${suffix}`, {
    token
  });
}

export async function getTaskDetails(token: string, taskId: number) {
  return apiFetch<TaskDetails>(`/Tasks/${taskId}`, {
    token
  });
}

export async function getMyTasks(
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

  return apiFetch<TaskRecord[]>(`/Tasks/mine${suffix}`, {
    token
  });
}

export async function getMyOffers(
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

  return apiFetch<MyOfferItem[]>(`/Tasks/offers/mine${suffix}`, {
    token
  });
}

export async function getMyJobs(
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

  return apiFetch<MyJobItem[]>(`/Tasks/jobs/mine${suffix}`, {
    token
  });
}

export async function createTask(token: string, payload: CreateTaskPayload) {
  return apiFetch<TaskRecord>("/Tasks", {
    method: "POST",
    token,
    body: payload
  });
}

export async function updateTask(token: string, taskId: number, payload: UpdateTaskPayload) {
  return apiFetch<void>(`/Tasks/${taskId}/update`, {
    method: "PATCH",
    token,
    body: payload
  });
}

export async function publishTask(token: string, taskId: number) {
  return apiFetch<void>(`/Tasks/${taskId}/publish`, {
    method: "POST",
    token
  });
}

export async function getTaskStats(token: string, taskId: number) {
  return apiFetch<TaskStats>(`/Tasks/${taskId}/stats`, {
    token
  });
}

export async function getTaskOffers(token: string, taskId: number) {
  return apiFetch<TaskOffer[]>(`/Tasks/${taskId}/offers`, {
    token
  });
}

export async function getTaskImages(token: string, taskId: number) {
  return apiFetch<TaskImage[]>(`/Tasks/${taskId}/images`, {
    token
  });
}

export async function uploadTaskImages(token: string, taskId: number, files: File[]) {
  const formData = new FormData();

  for (const file of files) {
    formData.append("Files", file);
  }

  return apiFetch<TaskImage[]>(`/Tasks/${taskId}/images`, {
    method: "POST",
    token,
    body: formData
  });
}

export async function deleteTaskImage(token: string, taskId: number, fileId: number) {
  return apiFetch<void>(`/Tasks/${taskId}/images/${fileId}`, {
    method: "DELETE",
    token
  });
}

export async function createOffer(
  token: string,
  taskId: number,
  payload: { price: number; comment: string | null }
) {
  return apiFetch<TaskOffer>(`/Tasks/${taskId}/offers`, {
    method: "POST",
    token,
    body: payload
  });
}

export async function assignOffer(token: string, taskId: number, offerId: number) {
  return apiFetch<void>(`/Tasks/${taskId}/assign/${offerId}`, {
    method: "POST",
    token
  });
}

export async function startTaskProgress(token: string, taskId: number) {
  return apiFetch<void>(`/Tasks/${taskId}/start`, {
    method: "POST",
    token
  });
}

export async function completeTask(token: string, taskId: number) {
  return apiFetch<void>(`/Tasks/${taskId}/complete`, {
    method: "POST",
    token
  });
}

export async function cancelTask(token: string, taskId: number) {
  return apiFetch<void>(`/Tasks/${taskId}/cancel`, {
    method: "POST",
    token
  });
}

export async function createTaskReview(
  token: string,
  payload: { taskId: number; score: number; comment: string | null }
) {
  return apiFetch<TaskReview>("/Reviews", {
    method: "POST",
    token,
    body: payload
  });
}

export async function getTaskMessages(
  token: string,
  taskId: number,
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

  return apiFetch<ChatMessage[]>(`/Tasks/${taskId}/messages${suffix}`, {
    token
  });
}

export async function sendTaskMessage(token: string, taskId: number, text: string) {
  return apiFetch<ChatMessage>(`/Tasks/${taskId}/messages`, {
    method: "POST",
    token,
    body: { text }
  });
}

export async function getTaskUnreadCount(token: string, taskId: number) {
  return apiFetch<UnreadCount>(`/Tasks/${taskId}/messages/unread-count`, {
    token
  });
}

export async function markTaskMessagesRead(
  token: string,
  taskId: number,
  lastReadMessageId: number
) {
  return apiFetch<void>(`/Tasks/${taskId}/messages/read`, {
    method: "PATCH",
    token,
    body: { lastReadMessageId }
  });
}
