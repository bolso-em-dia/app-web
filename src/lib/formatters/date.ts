const MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const DAY_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const SHORT_MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
});

export type CalendarDay = {
  isoValue: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
};

export type MonthOption = {
  isoValue: string;
  label: string;
  monthNumber: number;
};

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

function parseIsoParts(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { day, month, year };
}

function buildIsoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function formatLocalDate(date: Date) {
  return buildIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function cleanShortLabel(value: string) {
  return value.replace(".", "");
}

export function getCurrentReferenceMonth() {
  const now = new Date();
  return buildIsoDate(now.getFullYear(), now.getMonth() + 1, 1);
}

export function getCurrentIsoDate() {
  return formatLocalDate(new Date());
}

export function shiftReferenceMonth(value: string, deltaMonths: number) {
  const [year, month] = value.split("-").map(Number);
  return formatLocalDate(new Date(year, month - 1 + deltaMonths, 1));
}

export function moveDateToNextMonth(value: string) {
  const { day, month, year } = parseIsoParts(value);

  if (!year || !month || !day || !isValidDate(year, month, day)) {
    return "";
  }

  const nextMonthStart = new Date(year, month, 1);
  const nextYear = nextMonthStart.getFullYear();
  const nextMonth = nextMonthStart.getMonth() + 1;
  const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();

  return buildIsoDate(nextYear, nextMonth, Math.min(day, daysInNextMonth));
}

export function getReferenceMonthFromDate(value: string) {
  const { year, month } = parseIsoParts(value);

  if (!year || !month) {
    return "";
  }

  return buildIsoDate(year, month, 1);
}

export function getDayOfMonthFromDate(value: string) {
  const { day } = parseIsoParts(value);
  return day || null;
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

export function formatAccessibleDateLabel(value: string) {
  return FULL_DATE_FORMATTER.format(new Date(`${value}T00:00:00`));
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

export function getWeekdayLabels() {
  return Array.from({ length: 7 }, (_, index) => cleanShortLabel(WEEKDAY_FORMATTER.format(new Date(2026, 1, 1 + index))));
}

export function createCalendarDays(referenceMonth: string) {
  const { month, year } = parseIsoParts(referenceMonth);
  const firstDayWeekIndex = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPreviousMonth = new Date(year, month - 1, 0).getDate();
  const totalCells = Math.ceil((firstDayWeekIndex + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index): CalendarDay => {
    const dayOffset = index - firstDayWeekIndex + 1;

    if (dayOffset < 1) {
      const previousMonthDate = new Date(year, month - 2, daysInPreviousMonth + dayOffset);
      return {
        isoValue: buildIsoDate(previousMonthDate.getFullYear(), previousMonthDate.getMonth() + 1, previousMonthDate.getDate()),
        dayOfMonth: previousMonthDate.getDate(),
        inCurrentMonth: false,
      };
    }

    if (dayOffset > daysInMonth) {
      const nextMonthDate = new Date(year, month - 1, dayOffset);
      return {
        isoValue: buildIsoDate(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, nextMonthDate.getDate()),
        dayOfMonth: nextMonthDate.getDate(),
        inCurrentMonth: false,
      };
    }

    return {
      isoValue: buildIsoDate(year, month, dayOffset),
      dayOfMonth: dayOffset,
      inCurrentMonth: true,
    };
  });
}

export function createMonthOptions(year: number) {
  return Array.from({ length: 12 }, (_, monthIndex): MonthOption => {
    const date = new Date(year, monthIndex, 1);
    return {
      isoValue: buildIsoDate(year, monthIndex + 1, 1),
      label: cleanShortLabel(SHORT_MONTH_FORMATTER.format(date)),
      monthNumber: monthIndex + 1,
    };
  });
}

export function getYearFromIsoMonth(value: string) {
  return parseIsoParts(value).year;
}
