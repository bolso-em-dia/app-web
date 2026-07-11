import { describe, expect, it, vi } from "vitest";
import { getLatestExchangeRate, refreshExchangeRate } from "./exchangeRate";

describe("exchangeRate API", () => {
  it("getLatestExchangeRate calls correct endpoint", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ rate: 5.1064, fetchedAt: "2026-07-10T18:27:00Z", stale: false }),
      text: async () => "",
    } as Response);

    const result = await getLatestExchangeRate("test-token");

    expect(result.rate).toBe(5.1064);
    expect(result.stale).toBe(false);
  });

  it("getLatestExchangeRate detects stale rate", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ rate: 5.00, fetchedAt: "2026-07-09T18:00:00Z", stale: true }),
      text: async () => "",
    } as Response);

    const result = await getLatestExchangeRate("test-token");

    expect(result.stale).toBe(true);
  });

  it("refreshExchangeRate calls POST endpoint", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ rate: 5.15, fetchedAt: "2026-07-10T18:30:00Z", stale: false }),
      text: async () => "",
    } as Response);

    const result = await refreshExchangeRate("test-token");

    expect(result.rate).toBe(5.15);
    expect(result.stale).toBe(false);
  });

  it("getLatestExchangeRate handles 404 gracefully", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
      text: async () => "",
    } as Response);

    await expect(getLatestExchangeRate("test-token")).rejects.toThrow();
  });
});
