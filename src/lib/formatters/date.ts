const MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const DAY_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function sanitizeDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function isValidDate(year: number, month: number, day: number) {
  const parsedDate = new Date(year, month - 1, day);
  return parsedDate.getFullYear() === year && parsedDate.getMonth() === month - 1 && parsedDate.getDate() === day;
}

export function getCurrentReferenceMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
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

export function formatDateValue(value: string) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return "";
  }

  return `${day}/${month}/${year}`;
}

export function formatMonthValue(value: string) {
  const [year, month] = value.split("-");

  if (!year || !month) {
    return "";
  }

  return `${month}/${year}`;
}

export function formatPartialDateInput(value: string) {
  const digits = sanitizeDigits(value, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatPartialMonthInput(value: string) {
  const digits = sanitizeDigits(value, 6);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function parseFormattedDate(value: string) {
  const digits = sanitizeDigits(value, 8);

  if (digits.length !== 8) {
    return null;
  }

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4));

  if (!isValidDate(year, month, day)) {
    return null;
  }

  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseFormattedMonth(value: string) {
  const digits = sanitizeDigits(value, 6);

  if (digits.length !== 6) {
    return null;
  }

  const month = Number(digits.slice(0, 2));
  const year = Number(digits.slice(2));

  if (month < 1 || month > 12) {
    return null;
  }

  return `${year}-${pad(month)}-01`;
}
