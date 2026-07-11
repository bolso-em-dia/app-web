import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";

const defaultImpl = (...args: unknown[]) => {
  const input = String(args[0]);
  if (input.includes("/api/exchange-rate")) {
    return Promise.resolve({
      ok: false, status: 404, json: async () => ({}), text: async () => "",
    } as Response);
  }
  if (input.includes("/api/version")) {
    return Promise.resolve({
      ok: true, status: 200, text: async () => "1.0.0-test",
    } as Response);
  }
  return Promise.reject(
    new Error(`fetch mock não configurado para este teste. URL: ${input}`),
  );
};

Object.defineProperty(globalThis, "fetch", {
  value: vi.fn(defaultImpl),
  writable: true,
});

// Re-aplica implementacao default apos testes que chamam mockReset
afterEach(() => {
  vi.mocked(globalThis.fetch).mockImplementation(defaultImpl);
});

