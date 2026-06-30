const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
});

export function getCurrentReferenceMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

export function formatReferenceMonth(value: string) {
  return MONTH_FORMATTER.format(new Date(`${value}T00:00:00`));
}

export function formatDay(value: string) {
  return DAY_FORMATTER.format(new Date(`${value}T00:00:00`));
}
