import { describe, expect, it } from "vitest";
import { getLatestExchangeRate, refreshExchangeRate } from "./exchangeRate";
import {
  resetFetchMocks,
  mockJsonResponse,
  mockErrorResponse,
  mockFetchUrl,
} from "../../test/setup";

describe("exchangeRate API", () => {
  beforeEach(() => {
    resetFetchMocks();
  });

  it("getLatestExchangeRate calls correct endpoint", async () => {
    mockFetchUrl(
      "/api/exchange-rate/latest",
      mockJsonResponse({
        rate: 5.1064,
        fetchedAt: "2026-07-10T18:27:00Z",
        stale: false,
      }),
    );

    const result = await getLatestExchangeRate("test-token");

    expect(result.rate).toBe(5.1064);
    expect(result.stale).toBe(false);
  });

  it("getLatestExchangeRate detects stale rate", async () => {
    mockFetchUrl(
      "/api/exchange-rate/latest",
      mockJsonResponse({
        rate: 5.0,
        fetchedAt: "2026-07-09T18:00:00Z",
        stale: true,
      }),
    );

    const result = await getLatestExchangeRate("test-token");

    expect(result.stale).toBe(true);
  });

  it("refreshExchangeRate calls POST endpoint", async () => {
    mockFetchUrl(
      "/api/exchange-rate/refresh",
      mockJsonResponse({
        rate: 5.15,
        fetchedAt: "2026-07-10T18:30:00Z",
        stale: false,
      }),
    );

    const result = await refreshExchangeRate("test-token");

    expect(result.rate).toBe(5.15);
    expect(result.stale).toBe(false);
  });

  it("getLatestExchangeRate handles 404 gracefully", async () => {
    mockFetchUrl("/api/exchange-rate/latest", mockErrorResponse(404));

    await expect(getLatestExchangeRate("test-token")).rejects.toThrow();
  });
});
