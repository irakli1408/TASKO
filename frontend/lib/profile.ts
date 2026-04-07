import { apiFetch, ApiError } from "@/lib/api";
import { CurrentUser, LocationType } from "@/lib/auth";

export type ExecutorSection = {
  experienceYears: number | null;
};

export type MyProfile = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string | null;
  about: string | null;
  roleType: number;
  isExecutorActive: boolean;
  locationType: LocationType;
  executorLocationTypes: number[];
  ratingAverage: number;
  ratingCount: number;
  createdAtUtc: string;
  executor: ExecutorSection | null;
};

export type Category = {
  id: number;
  name: string;
};

export type CategoryTree = {
  id: number;
  name: string;
  children: CategoryTree[];
};

export type ExecutorLocationsResponse = {
  locationTypes: LocationType[];
};

export type ExecutorPublicProfile = {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  about: string | null;
  ratingAverage: number;
  ratingCount: number;
  locationType: LocationType;
  experienceYears: number | null;
  categoryIds: number[];
};

export type UpdateProfilePayload = {
  firstName: string;
  lastName: string;
  phone: string;
  about: string | null;
  avatarUrl: string | null;
};

export async function getMyProfile(token: string) {
  return apiFetch<MyProfile>("/Profile/me", {
    token
  });
}

export async function getExecutorPublicProfile(executorId: number) {
  return apiFetch<ExecutorPublicProfile>(`/Profile/${executorId}`);
}

export async function updateMyProfile(token: string, payload: UpdateProfilePayload) {
  return apiFetch<MyProfile>("/Profile/me", {
    method: "PATCH",
    token,
    body: payload
  });
}

export async function uploadMyAvatar(token: string, file: File) {
  const formData = new FormData();
  formData.append("File", file);

  return apiFetch<MyProfile>("/Profile/me/avatar", {
    method: "POST",
    token,
    body: formData
  });
}

export async function enableExecutor(
  token: string,
  payload: { locationType: LocationType; experienceYears: number | null }
) {
  return apiFetch<MyProfile>("/Profile/me/executor/enable", {
    method: "PUT",
    token,
    body: payload
  });
}

export async function disableExecutor(token: string) {
  return apiFetch<MyProfile>("/Profile/me/executor/disable", {
    method: "PUT",
    token
  });
}

export async function updateExecutorProfile(
  token: string,
  payload: { experienceYears: number | null }
) {
  return apiFetch<MyProfile>("/Profile/me/executor", {
    method: "PUT",
    token,
    body: payload
  });
}

export async function getCategories(token: string) {
  return apiFetch<Category[]>("/Categories", {
    token
  });
}

export async function getCategoryTree(token: string) {
  return apiFetch<CategoryTree[]>("/Categories/tree", {
    token
  });
}

export async function getMyExecutorCategories(token: string) {
  return apiFetch<number[]>("/Categories/me/executor/categories", {
    token
  });
}

export async function updateMyExecutorCategories(token: string, categoryIds: number[]) {
  return apiFetch<number[]>("/Categories/me/executor/categories", {
    method: "PUT",
    token,
    body: { categoryIds }
  });
}

export async function getMyExecutorLocations(token: string) {
  return apiFetch<ExecutorLocationsResponse>("/Profile/me/executor/locations", {
    token
  });
}

export async function updateMyExecutorLocations(token: string, locationTypes: LocationType[]) {
  return apiFetch<ExecutorLocationsResponse>("/Profile/me/executor/locations", {
    method: "PUT",
    token,
    body: { locationTypes }
  });
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export function mapProfileToCurrentUser(profile: MyProfile): CurrentUser {
  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    roleType: profile.roleType,
    isExecutorActive: profile.isExecutorActive,
    locationType: profile.locationType,
    ratingAverage: profile.ratingAverage,
    ratingCount: profile.ratingCount,
    createdAtUtc: profile.createdAtUtc
  };
}
