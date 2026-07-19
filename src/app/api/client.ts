declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiBaseUrl?: string;
    };
  }
}

function resolveApiBaseUrl() {
  const runtimeApiBaseUrl = window.__APP_CONFIG__?.apiBaseUrl?.trim();

  if (runtimeApiBaseUrl) {
    return runtimeApiBaseUrl;
  }

  return import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
}

const API_BASE_URL = resolveApiBaseUrl();

type RequestOptions = RequestInit & {
  accessToken?: string | null;
  skipAuthRetry?: boolean;
};

type ApiClientAuthConfig = {
  getAccessToken?: () => string | null;
  refreshAccessToken?: () => Promise<string | null>;
  onUnauthorized?: () => void;
};

export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

const DEFAULT_API_ERROR_MESSAGE = "API_REQUEST_FAILED";

type ApiFieldError = {
  field: string;
  message: string;
};

function isApiFieldError(value: unknown): value is ApiFieldError {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate.field === "string" && typeof candidate.message === "string";
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: number | null,
    public readonly backendMessage: string,
    public readonly errorType: string,
    public readonly fieldErrors?: ApiFieldError[],
  ) {
    super(backendMessage || errorType || DEFAULT_API_ERROR_MESSAGE);
    this.name = "ApiError";
  }

  static fromResponse(status: number, body: Record<string, unknown>) {
    return new ApiError(
      status,
      typeof body.code === "number" ? body.code : null,
      typeof body.message === "string" ? body.message : "",
      typeof body.error === "string" ? body.error : "",
      Array.isArray(body.errors) ? body.errors.filter(isApiFieldError) : undefined,
    );
  }
}

function parseApiErrorBody(bodyText: string) {
  if (!bodyText) {
    return null;
  }

  try {
    const parsed = JSON.parse(bodyText) as unknown;
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

let authConfig: ApiClientAuthConfig = {};
let refreshInFlight: Promise<string | null> | null = null;

export function configureApiClientAuth(config: ApiClientAuthConfig) {
  authConfig = config;
}

async function refreshAccessTokenOnce() {
  if (!authConfig.refreshAccessToken) {
    return null;
  }

  if (!refreshInFlight) {
    refreshInFlight = authConfig
      .refreshAccessToken()
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

function resolveAccessToken(requestAccessToken?: string | null) {
  return authConfig.getAccessToken?.() ?? requestAccessToken ?? null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  const resolvedAccessToken = resolveAccessToken(options.accessToken);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (resolvedAccessToken) {
    headers.set("Authorization", `Bearer ${resolvedAccessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const shouldRetryAuth =
      !options.skipAuthRetry &&
      Boolean(resolvedAccessToken) &&
      !path.startsWith("/api/auth/") &&
      (response.status === 401 || response.status === 403);

    if (shouldRetryAuth) {
      const refreshedAccessToken = await refreshAccessTokenOnce();

      if (refreshedAccessToken) {
        return apiRequest<T>(path, {
          ...options,
          accessToken: refreshedAccessToken,
          skipAuthRetry: true,
        });
      }

      authConfig.onUnauthorized?.();
    }

    const bodyText = await response.text();
    const parsedBody = parseApiErrorBody(bodyText);

    if (parsedBody) {
      throw ApiError.fromResponse(response.status, parsedBody);
    }

    throw new ApiError(response.status, null, bodyText || DEFAULT_API_ERROR_MESSAGE, response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
