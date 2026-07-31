import { ChevronLeft, ChevronRight } from "lucide-react";
import { forwardRef, useId, useMemo, useRef, useState } from "react";
import type { FocusEvent, InputHTMLAttributes, KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { useI18n } from "../../app/i18n/I18nContext";
import {
  createCalendarDays,
  formatAccessibleDateLabel,
  formatDateValue,
  formatPartialDateInput,
  formatReferenceMonth,
  getCurrentIsoDate,
  getReferenceMonthFromDate,
  getWeekdayLabels,
  parseFormattedDate,
  shiftReferenceMonth,
} from "../../lib/formatters/date";
import Input from "./Input";
import styles from "./DateInput.module.scss";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "onChange" | "type" | "value"> & {
  hasError?: boolean;
  value: string;
  onChange: (value: string) => void;
};

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { hasError = false, onBlur, onChange, onFocus, value, ...props },
  ref,
) {
  const { t } = useI18n();
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => getReferenceMonthFromDate(value) || getReferenceMonthFromDate(getCurrentIsoDate()),
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ignoreNextFocusRef = useRef(false);
  const titleId = useId();
  const displayValue = draftValue ?? formatDateValue(value);
  const isDisabled = props.disabled || props.readOnly;
  const weekdayLabels = useMemo(() => getWeekdayLabels(), []);
  const calendarDays = useMemo(() => createCalendarDays(visibleMonth), [visibleMonth]);

  function resolveVisibleMonth(nextIsoValue: string) {
    return getReferenceMonthFromDate(nextIsoValue) || visibleMonth;
  }

  function finalizeInteraction(currentDisplayValue: string) {
    const parsedValue = parseFormattedDate(currentDisplayValue);

    if (parsedValue) {
      onChange(parsedValue);
      setVisibleMonth(resolveVisibleMonth(parsedValue));
    } else if (currentDisplayValue === "") {
      onChange("");
    }

    setDraftValue(null);
    setIsOpen(false);
  }

  function handleOpen() {
    if (isDisabled) {
      return;
    }

    setDraftValue(formatDateValue(value));
    setVisibleMonth(resolveVisibleMonth(value || getReferenceMonthFromDate(getCurrentIsoDate())));
    setIsOpen(true);
  }

  function handleWrapperBlur(event: FocusEvent<HTMLDivElement>) {
    if (rootRef.current?.contains(event.relatedTarget as Node | null)) {
      return;
    }

    finalizeInteraction(displayValue);
    onBlur?.(event as unknown as FocusEvent<HTMLInputElement>);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    finalizeInteraction(displayValue);

    if (document.activeElement !== inputRef.current) {
      ignoreNextFocusRef.current = true;
      inputRef.current?.focus();
    }
  }

  function handleSelectDate(nextIsoValue: string) {
    onChange(nextIsoValue);
    setVisibleMonth(getReferenceMonthFromDate(nextIsoValue));
    setDraftValue(null);
    setIsOpen(false);
  }

  return (
    <div className={styles.root} onBlur={handleWrapperBlur} onKeyDown={handleKeyDown} ref={rootRef}>
      <Input
        {...props}
        aria-controls={isOpen ? `${props.id ?? "date-input"}-popover` : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        autoComplete="off"
        hasError={hasError}
        inputMode="numeric"
        onChange={(event) => {
          const nextDisplayValue = formatPartialDateInput(event.target.value);
          const parsedValue = parseFormattedDate(nextDisplayValue);

          setDraftValue(nextDisplayValue);

          if (parsedValue) {
            onChange(parsedValue);
            setVisibleMonth(getReferenceMonthFromDate(parsedValue));
            return;
          }

          if (nextDisplayValue === "") {
            onChange("");
          }
        }}
        onFocus={(event) => {
          if (ignoreNextFocusRef.current) {
            ignoreNextFocusRef.current = false;
            onFocus?.(event);
            return;
          }

          handleOpen();
          onFocus?.(event);
        }}
        ref={(node) => {
          inputRef.current = node;

          if (typeof ref === "function") {
            ref(node);
            return;
          }

          if (ref) {
            ref.current = node;
          }
        }}
        type="text"
        value={displayValue}
      />

      {isOpen ? (
        <div aria-labelledby={titleId} className={styles.popover} id={`${props.id ?? "date-input"}-popover`} role="dialog">
          <div className={styles.popoverHeader}>
            <button
              aria-label={t("common.previousMonth")}
              className={styles.navButton}
              onClick={() => setVisibleMonth((currentValue) => shiftReferenceMonth(currentValue, -1))}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={16} />
            </button>
            <strong className={styles.popoverTitle} id={titleId}>
              {formatReferenceMonth(visibleMonth)}
            </strong>
            <button
              aria-label={t("common.nextMonth")}
              className={styles.navButton}
              onClick={() => setVisibleMonth((currentValue) => shiftReferenceMonth(currentValue, 1))}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={16} />
            </button>
          </div>

          <div className={styles.weekdayRow}>
            {weekdayLabels.map((weekdayLabel) => (
              <span className={styles.weekdayCell} key={weekdayLabel}>
                {weekdayLabel}
              </span>
            ))}
          </div>

          <div className={styles.calendarGrid}>
            {calendarDays.map((day) => {
              const isSelected = value === day.isoValue;

              return (
                <button
                  aria-label={formatAccessibleDateLabel(day.isoValue)}
                  aria-pressed={isSelected}
                  className={`${styles.dayButton} ${!day.inCurrentMonth ? styles.dayButtonMuted : ""} ${isSelected ? styles.dayButtonSelected : ""}`.trim()}
                  key={day.isoValue}
                  onClick={() => handleSelectDate(day.isoValue)}
                  onMouseDown={(event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault()}
                  type="button"
                >
                  {day.dayOfMonth}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default DateInput;
