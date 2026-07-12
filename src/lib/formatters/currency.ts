const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export type Currency = "BRL" | "USD";

export function formatCurrency(value: number, currency?: Currency) {
  const fmt = currency === "USD" ? USD_FORMATTER : BRL_FORMATTER;
  return fmt.format(value);
}

export function parseCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 0) {
    return 0;
  }

  return Number(digits) / 100;
}

export function formatCurrencyInput(
  value: number | null | undefined,
  currency?: Currency,
) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return formatCurrency(0, currency);
  }

  return formatCurrency(value, currency);
}
