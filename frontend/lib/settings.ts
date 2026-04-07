import { ApiError, apiFetch } from "@/lib/api";

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export async function changePasswordRequest(
  token: string,
  payload: ChangePasswordPayload
) {
  return apiFetch<void>("/Auth/change-password", {
    method: "POST",
    token,
    body: payload
  });
}

export function getSettingsErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
