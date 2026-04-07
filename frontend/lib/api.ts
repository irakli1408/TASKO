import { defaultLocale, getStoredLocale } from "@/lib/i18n";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5077";

const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION ?? "v1";
const API_CULTURE = process.env.NEXT_PUBLIC_API_CULTURE ?? defaultLocale;

export const apiConfig = {
  baseUrl: API_BASE_URL,
  version: API_VERSION,
  culture: API_CULTURE
};

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const culture = typeof window === "undefined" ? apiConfig.culture : getStoredLocale();
  return `${apiConfig.baseUrl}/api/${apiConfig.version}/${culture}${normalizedPath}`;
}

export function buildHubUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiConfig.baseUrl}${normalizedPath}`;
}

export function resolveAssetUrl(path: string | null | undefined) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiConfig.baseUrl}${normalizedPath}`;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: HttpMethod;
  token?: string;
  body?: BodyInit | object;
  headers?: HeadersInit;
};

export async function apiFetch<T>(
  path: string,
  { method = "GET", token, body, headers }: RequestOptions = {}
): Promise<T> {
  const initHeaders = new Headers(headers);

  if (token) {
    initHeaders.set("Authorization", `Bearer ${token}`);
  }

  let requestBody: BodyInit | undefined;

  if (body instanceof FormData || typeof body === "string" || body instanceof Blob) {
    requestBody = body;
  } else if (body !== undefined) {
    initHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(buildApiUrl(path), {
    method,
    headers: initHeaders,
    body: requestBody,
    cache: "no-store"
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    let message = `API request failed: ${response.status} ${response.statusText}`;
    let details: unknown;

    if (contentType.includes("application/json")) {
      try {
        details = await response.json();

        if (typeof details === "object" && details !== null) {
          const maybeMessage =
            ("message" in details && typeof details.message === "string" && details.message) ||
            ("title" in details && typeof details.title === "string" && details.title) ||
            ("error" in details && typeof details.error === "string" && details.error);

          if (maybeMessage) {
            message = maybeMessage;
          }
        }
      } catch {
        // ignore malformed JSON error bodies
      }
    } else {
      const text = await response.text();
      if (text.trim()) {
        message = text.trim();
      }
    }

    throw new ApiError(response.status, message, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    return (text ? text : undefined) as T;
  }

  const raw = await response.text();

  if (!raw.trim()) {
    return undefined as T;
  }

  return JSON.parse(raw) as T;
}
