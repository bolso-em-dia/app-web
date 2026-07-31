import { ChevronLeft, ChevronRight } from "lucide-react";
import { forwardRef, useId, useMemo, useRef, useState } from "react";
import type { FocusEvent, InputHTMLAttributes, KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { useI18n } from "../../app/i18n/I18nContext";
import {
  createMonthOptions,
  formatMonthValue,
  formatPartialMonthInput,
  getReferenceMonthFromDate,
  getYearFromIsoMonth,
  parseFormattedMonth,
} from "../../lib/formatters/date";
import Input from "./Input";
import styles from "./DateInput.module.scss";

type MonthInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "onChange" | "type" | "value"> & {
  hasError?: boolean;
  value: string;
  onChange: (value: string) => void;
};

const MonthInput = forwardRef<HTMLInputElement, MonthInputProps>(function MonthInput(
  { hasError = false, onBlur, onChange, onFocus, value, ...props },
  ref,
) {
  const { t } = useI18n();
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleYear, setVisibleYear] = useState(() => getYearFromIsoMonth(value) || new Date().getFullYear());
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ignoreNextFocusRef = useRef(false);
  const titleId = useId();
  const displayValue = draftValue ?? formatMonthValue(value);
  const isDisabled = props.disabled || props.readOnly;
  const monthOptions = useMemo(() => createMonthOptions(visibleYear), [visibleYear]);

  function finalizeInteraction(currentDisplayValue: string) {
    const parsedValue = parseFormattedMonth(currentDisplayValue);

    if (parsedValue) {
      onChange(parsedValue);
      setVisibleYear(getYearFromIsoMonth(parsedValue));
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

    setDraftValue(formatMonthValue(value));
    setVisibleYear(getYearFromIsoMonth(value) || new Date().getFullYear());
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

  function handleSelectMonth(nextIsoValue: string) {
    onChange(nextIsoValue);
    setVisibleYear(getYearFromIsoMonth(nextIsoValue));
    setDraftValue(null);
    setIsOpen(false);
  }

  return (
    <div className={styles.root} onBlur={handleWrapperBlur} onKeyDown={handleKeyDown} ref={rootRef}>
      <Input
        {...props}
        aria-controls={isOpen ? `${props.id ?? "month-input"}-popover` : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        autoComplete="off"
        hasError={hasError}
        inputMode="numeric"
        onChange={(event) => {
          const nextDisplayValue = formatPartialMonthInput(event.target.value);
          const parsedValue = parseFormattedMonth(nextDisplayValue);

          setDraftValue(nextDisplayValue);

          if (parsedValue) {
            onChange(parsedValue);
            setVisibleYear(getYearFromIsoMonth(parsedValue));
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
        <div aria-labelledby={titleId} className={styles.popover} id={`${props.id ?? "month-input"}-popover`} role="dialog">
          <div className={styles.popoverHeader}>
            <button
              aria-label={t("common.previous")}
              className={styles.navButton}
              onClick={() => setVisibleYear((currentValue) => currentValue - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={16} />
            </button>
            <strong className={styles.popoverTitle} id={titleId}>
              {visibleYear}
            </strong>
            <button
              aria-label={t("common.next")}
              className={styles.navButton}
              onClick={() => setVisibleYear((currentValue) => currentValue + 1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={16} />
            </button>
          </div>

          <div className={styles.monthGrid}>
            {monthOptions.map((monthOption) => {
              const isSelected = getReferenceMonthFromDate(value) === monthOption.isoValue;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`${styles.monthButton} ${isSelected ? styles.monthButtonSelected : ""}`.trim()}
                  key={monthOption.isoValue}
                  onClick={() => handleSelectMonth(monthOption.isoValue)}
                  onMouseDown={(event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault()}
                  type="button"
                >
                  {monthOption.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default MonthInput;
