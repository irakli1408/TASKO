const RESPONDED_TASKS_KEY = "tasko.respondedTasks";

export function getRespondedTaskIds() {
  if (typeof window === "undefined") {
    return [] as number[];
  }

  const raw = window.localStorage.getItem(RESPONDED_TASKS_KEY);

  if (!raw) {
    return [] as number[];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "number") : [];
  } catch {
    return [];
  }
}

export function markTaskResponded(taskId: number) {
  if (typeof window === "undefined") {
    return;
  }

  const current = new Set(getRespondedTaskIds());
  current.add(taskId);
  window.localStorage.setItem(RESPONDED_TASKS_KEY, JSON.stringify([...current]));
}
