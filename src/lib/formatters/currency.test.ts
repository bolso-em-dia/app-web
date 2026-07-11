import { describe, expect, it } from "vitest";
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "./currency";

describe("formatCurrency", () => {
  it("formats BRL with R$ prefix", () => {
    expect(formatCurrency(100)).toBe("R$ 100,00");
  });

  it("formats USD with $ prefix", () => {
    expect(formatCurrency(100, "USD")).toBe("$100.00");
  });

  it("formats zero value with BRL by default", () => {
    expect(formatCurrency(0)).toBe("R$ 0,00");
  });

  it("formats zero value with USD", () => {
    expect(formatCurrency(0, "USD")).toBe("$0.00");
  });

  it("formats negative value with USD", () => {
    expect(formatCurrency(-50, "USD")).toBe("-$50.00");
  });

  it("formats large amount in BRL", () => {
    expect(formatCurrency(1234567.89)).toBe("R$ 1.234.567,89");
  });
});

describe("formatCurrencyInput", () => {
  it("formats with USD when currency specified", () => {
    expect(formatCurrencyInput(100, "USD")).toBe("$100.00");
  });

  it("defaults to BRL when no currency", () => {
    expect(formatCurrencyInput(100)).toBe("R$ 100,00");
  });
});

describe("parseCurrencyInput", () => {
  it("strips non-digits and divides by 100", () => {
    expect(parseCurrencyInput("$100.00")).toBe(100);
  });

  it("returns 0 for empty input", () => {
    expect(parseCurrencyInput("")).toBe(0);
  });
});
