import { describe, expect, it, vi } from "vitest";
import {
  createCalendarDays,
  createMonthOptions,
  formatAccessibleDateLabel,
  formatDateValue,
  formatDay,
  formatMonthValue,
  formatPartialDateInput,
  formatPartialMonthInput,
  formatReferenceMonth,
  getCurrentIsoDate,
  getReferenceMonthFromDate,
  getCurrentReferenceMonth,
  getWeekdayLabels,
  getYearFromIsoMonth,
  isCurrentReferenceMonth,
  parseFormattedDate,
  parseFormattedMonth,
  shiftReferenceMonth,
} from "./date";

describe("getCurrentReferenceMonth", () => {
  it("returns the first day of the current month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T10:00:00Z"));
    expect(getCurrentReferenceMonth()).toBe("2026-07-01");
    vi.useRealTimers();
  });
});

describe("getCurrentIsoDate", () => {
  it("returns the current local date in ISO format", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T10:00:00Z"));
    expect(getCurrentIsoDate()).toBe("2026-07-15");
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

describe("BR text input helpers", () => {
  it("formats ISO date values as dd/mm/yyyy", () => {
    expect(formatDateValue("2026-07-05")).toBe("05/07/2026");
  });

  it("formats ISO month values as mm/yyyy", () => {
    expect(formatMonthValue("2026-07-01")).toBe("07/2026");
  });

  it("builds partial BR date input masks", () => {
    expect(formatPartialDateInput("05072026")).toBe("05/07/2026");
    expect(formatPartialDateInput("0507")).toBe("05/07");
  });

  it("builds partial BR month input masks", () => {
    expect(formatPartialMonthInput("072026")).toBe("07/2026");
    expect(formatPartialMonthInput("07")).toBe("07");
  });

  it("parses valid BR date values to ISO", () => {
    expect(parseFormattedDate("05/07/2026")).toBe("2026-07-05");
  });

  it("rejects invalid BR date values", () => {
    expect(parseFormattedDate("31/02/2026")).toBeNull();
  });

  it("parses valid BR month values to ISO reference months", () => {
    expect(parseFormattedMonth("07/2026")).toBe("2026-07-01");
  });

  it("rejects invalid BR month values", () => {
    expect(parseFormattedMonth("13/2026")).toBeNull();
  });

  it("extracts the reference month from an ISO date", () => {
    expect(getReferenceMonthFromDate("2026-07-05")).toBe("2026-07-01");
  });

  it("formats full accessible date labels in pt-BR", () => {
    expect(formatAccessibleDateLabel("2026-07-05")).toMatch(/05.*julho.*2026/i);
  });

  it("creates weekday labels for the picker header", () => {
    expect(getWeekdayLabels()).toHaveLength(7);
  });

  it("creates a calendar grid aligned to full weeks", () => {
    const days = createCalendarDays("2026-07-01");

    expect(days).toHaveLength(35);
    expect(days.some((day) => day.isoValue === "2026-07-01" && day.inCurrentMonth)).toBe(true);
  });

  it("creates month options for a given year", () => {
    const months = createMonthOptions(2026);

    expect(months).toHaveLength(12);
    expect(months[0]?.isoValue).toBe("2026-01-01");
    expect(months[11]?.isoValue).toBe("2026-12-01");
  });

  it("extracts the year from an ISO month value", () => {
    expect(getYearFromIsoMonth("2026-07-01")).toBe(2026);
  });
});
