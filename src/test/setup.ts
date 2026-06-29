import "@testing-library/jest-dom";
import { vi } from "vitest";

Object.defineProperty(globalThis, "fetch", {
  value: vi.fn(() =>
    Promise.reject(new Error("fetch mock não configurado para este teste.")),
  ),
  writable: true,
});
