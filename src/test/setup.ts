import "@testing-library/jest-dom";
import { vi } from "vitest";

const defaultFetch = vi.fn((...args: unknown[]) => {
  const input = String(args[0]);
  if (input.includes("/api/exchange-rate")) {
    return Promise.resolve({
      ok: false,
      status: 404,
      json: async () => ({}),
      text: async () => "",
    } as Response);
  }
  return Promise.reject(
    new Error(`fetch mock não configurado para este teste. URL: ${input}`),
  );
});

Object.defineProperty(globalThis, "fetch", {
  value: defaultFetch,
  writable: true,
});
