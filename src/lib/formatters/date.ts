const MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const DAY_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

export function getCurrentReferenceMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

export function shiftReferenceMonth(value: string, deltaMonths: number) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1 + deltaMonths, 1).toISOString().slice(0, 10);
}

export function isCurrentReferenceMonth(value: string) {
  return value === getCurrentReferenceMonth();
}

export function formatReferenceMonth(value: string) {
  return MONTH_FORMATTER.format(new Date(`${value}T00:00:00`));
}

export function formatDay(value: string) {
  return DAY_FORMATTER.format(new Date(`${value}T00:00:00`));
}
