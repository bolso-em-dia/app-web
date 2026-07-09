import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, configureApiClientAuth } from "./client";

describe("apiRequest", () => {
  beforeEach(() => {
    configureApiClientAuth({});
  });

  afterEach(() => {
    vi.clearAllMocks();
    configureApiClientAuth({});
  });

  it("refreshes the access token once and retries protected requests after 403", async () => {
    let currentAccessToken = "expired-token";
    const refreshAccessToken = vi.fn().mockImplementation(async () => {
      currentAccessToken = "renewed-token";
      return currentAccessToken;
    });

    configureApiClientAuth({
      getAccessToken: () => currentAccessToken,
      refreshAccessToken,
      onUnauthorized: vi.fn(),
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
        text: async () => "",
      } as Response);

    await expect(
      apiRequest<{ items: unknown[] }>("/api/fixed-transactions", {
        method: "GET",
        accessToken: "stale-render-token",
      }),
    ).resolves.toEqual({ items: [] });

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    const firstRequest = vi.mocked(fetch).mock.calls[0];
    const firstHeaders = new Headers(
      ((firstRequest?.[1]?.headers as HeadersInit | undefined) ?? {}),
    );
    expect(firstHeaders.get("Authorization")).toBe("Bearer expired-token");

    const retriedRequest = vi.mocked(fetch).mock.calls[1];
    const retriedHeaders = new Headers(
      ((retriedRequest?.[1]?.headers as HeadersInit | undefined) ?? {}),
    );
    expect(retriedHeaders.get("Authorization")).toBe("Bearer renewed-token");
  });

  it("prefers the current auth token over a stale token captured by the caller", async () => {
    configureApiClientAuth({
      getAccessToken: () => "fresh-token",
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      text: async () => "",
    } as Response);

    await expect(
      apiRequest<{ ok: boolean }>("/api/fixed-transactions", {
        method: "GET",
        accessToken: "stale-render-token",
      }),
    ).resolves.toEqual({ ok: true });

    const request = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers(
      ((request?.[1]?.headers as HeadersInit | undefined) ?? {}),
    );
    expect(headers.get("Authorization")).toBe("Bearer fresh-token");
  });

  it("deduplicates refresh calls across concurrent protected requests", async () => {
    let currentAccessToken = "expired-token";
    const refreshAccessToken = vi.fn().mockImplementation(async () => {
      currentAccessToken = "renewed-token";
      return currentAccessToken;
    });

    configureApiClientAuth({
      getAccessToken: () => currentAccessToken,
      refreshAccessToken,
      onUnauthorized: vi.fn(),
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 1 }),
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 2 }),
        text: async () => "",
      } as Response);

    const [first, second] = await Promise.all([
      apiRequest<{ id: number }>("/api/fixed-transactions", {
        method: "GET",
        accessToken: "stale-render-token",
      }),
      apiRequest<{ id: number }>("/api/accounts", {
        method: "GET",
        accessToken: "stale-render-token",
      }),
    ]);

    expect(first).toEqual({ id: 1 });
    expect(second).toEqual({ id: 2 });
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(4);
  });

  it("does not attempt auth retry on auth endpoints", async () => {
    const refreshAccessToken = vi.fn();

    configureApiClientAuth({
      getAccessToken: () => "expired-token",
      refreshAccessToken,
      onUnauthorized: vi.fn(),
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    } as Response);

    await expect(
      apiRequest("/api/auth/me", {
        method: "GET",
        accessToken: "expired-token",
      }),
    ).rejects.toThrow("Unauthorized");

    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it("clears auth state when refresh cannot recover the protected request", async () => {
    const onUnauthorized = vi.fn();

    configureApiClientAuth({
      getAccessToken: () => "expired-token",
      refreshAccessToken: vi.fn().mockResolvedValue(null),
      onUnauthorized,
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => "Forbidden",
    } as Response);

    await expect(
      apiRequest("/api/fixed-transactions", {
        method: "GET",
        accessToken: "stale-render-token",
      }),
    ).rejects.toThrow("Forbidden");

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
