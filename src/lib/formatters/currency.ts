const BRL_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number) {
  return BRL_FORMATTER.format(value);
}
