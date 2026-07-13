import { describe, it, expect, vi } from "vitest";
import { getCurrentReferenceMonth, shiftReferenceMonth, isCurrentReferenceMonth, formatReferenceMonth, formatDay } from "./date";

describe("getCurrentReferenceMonth", () => {
  it("returns the first day of the current month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T10:00:00Z"));
    expect(getCurrentReferenceMonth()).toBe("2026-07-01");
    vi.useRealTimers();
  });
});

describe("shiftReferenceMonth", () => {
  it("shifts forward by 1 month", () => {
    expect(shiftReferenceMonth("2026-07-01", 1)).toBe("2026-08-01");
  });

  it("shifts backward by 1 month", () => {
    expect(shiftReferenceMonth("2026-07-01", -1)).toBe("2026-06-01");
  });

  it("crosses year boundary forward", () => {
    expect(shiftReferenceMonth("2026-12-01", 1)).toBe("2027-01-01");
  });

  it("crosses year boundary backward", () => {
    expect(shiftReferenceMonth("2026-01-01", -1)).toBe("2025-12-01");
  });
});

describe("isCurrentReferenceMonth", () => {
  it("returns true for current month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T10:00:00Z"));
    expect(isCurrentReferenceMonth("2026-07-01")).toBe(true);
    vi.useRealTimers();
  });

  it("returns false for other months", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T10:00:00Z"));
    expect(isCurrentReferenceMonth("2026-06-01")).toBe(false);
    vi.useRealTimers();
  });
});

describe("formatReferenceMonth", () => {
  it("formats as month/year in pt-BR", () => {
    // Intl.DateTimeFormat produces locale-specific output, e.g. "julho de 2026"
    const result = formatReferenceMonth("2026-07-01");
    expect(result).toMatch(/julho.*2026|jul.*2026/i);
  });

  it("handles January", () => {
    const result = formatReferenceMonth("2026-01-01");
    expect(result).toMatch(/janeiro.*2026|jan.*2026/i);
  });
});

describe("formatDay", () => {
  it("formats day with short month", () => {
    const result = formatDay("2026-07-05");
    expect(result).toMatch(/05.*jul/i);
  });

  it("formats double digit day", () => {
    const result = formatDay("2026-07-15");
    expect(result).toMatch(/15.*jul/i);
  });
});
