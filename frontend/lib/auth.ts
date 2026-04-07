import { apiFetch } from "@/lib/api";

export enum UserRoleType {
  Customer = 1,
  Executor = 2,
  Both = 3
}

export enum LocationType {
  AllCity = 1,
  Mtatsminda = 2,
  Vake = 3,
  Saburtalo = 4,
  Krtsanisi = 5,
  Isani = 6,
  Samgori = 7,
  Chugureti = 8,
  Didube = 9,
  Nadzaladevi = 10,
  Gldani = 11
}

export type AuthTokens = {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
};

export type CurrentUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleType: UserRoleType;
  isExecutorActive: boolean;
  locationType: LocationType;
  ratingAverage: number;
  ratingCount: number;
  createdAtUtc: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  firstName: string;
  lastName: string;
  phone: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

const STORAGE_KEY = "tasko.auth";

export function loadStoredTokens(): AuthTokens | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function storeTokens(tokens: AuthTokens | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!tokens) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export async function loginRequest(payload: LoginPayload) {
  return apiFetch<AuthTokens>("/Auth/login", {
    method: "POST",
    body: payload
  });
}

export async function registerRequest(payload: RegisterPayload) {
  return apiFetch<AuthTokens>("/Auth/register", {
    method: "POST",
    body: payload
  });
}

export async function refreshRequest(refreshToken: string) {
  return apiFetch<AuthTokens>("/Auth/refresh", {
    method: "POST",
    body: { refreshToken }
  });
}

export async function logoutRequest(tokens: AuthTokens) {
  return apiFetch<void>("/Auth/logout", {
    method: "POST",
    token: tokens.accessToken,
    body: { refreshToken: tokens.refreshToken }
  });
}

export async function meRequest(accessToken: string) {
  return apiFetch<CurrentUser>("/Auth/me", {
    token: accessToken
  });
}

export async function forgotPasswordRequest(payload: ForgotPasswordPayload) {
  return apiFetch<{ message: string }>("/Auth/forgot", {
    method: "POST",
    body: payload
  });
}

export async function resetPasswordRequest(payload: ResetPasswordPayload) {
  return apiFetch<{ message: string }>("/Auth/reset", {
    method: "POST",
    body: payload
  });
}
