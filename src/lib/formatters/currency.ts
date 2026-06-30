const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number) {
  return BRL_FORMATTER.format(value);
}

export function parseCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 0) {
    return 0;
  }

  return Number(digits) / 100;
}

export function formatCurrencyInput(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return formatCurrency(0);
  }

  return formatCurrency(value);
}
