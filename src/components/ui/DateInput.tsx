import { CalendarDays } from "lucide-react";
import { forwardRef, useRef, useState } from "react";
import type { FocusEvent, InputHTMLAttributes, MouseEvent } from "react";
import { useI18n } from "../../app/i18n/I18nContext";
import { formatDateValue, formatPartialDateInput, parseFormattedDate } from "../../lib/formatters/date";
import Input from "./Input";
import styles from "./DateInput.module.scss";

type PickerInputElement = HTMLInputElement & {
  showPicker?: () => void;
};

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
  const pickerInputRef = useRef<PickerInputElement | null>(null);
  const displayValue = draftValue ?? formatDateValue(value);
  const isPickerDisabled = props.disabled || props.readOnly;

  const handleOpenPicker = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const pickerInput = pickerInputRef.current;

    if (!pickerInput || isPickerDisabled) {
      return;
    }

    if (typeof pickerInput.showPicker === "function") {
      pickerInput.showPicker();
      return;
    }

    pickerInput.focus();
    pickerInput.click();
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const parsedValue = parseFormattedDate(displayValue);

    if (parsedValue) {
      onChange(parsedValue);
    } else if (displayValue === "") {
      onChange("");
    }

    setDraftValue(null);

    onBlur?.(event);
  };

  return (
    <div className={styles.root}>
      <Input
        {...props}
        ref={ref}
        autoComplete="off"
        hasError={hasError}
        inputMode="numeric"
        onBlur={handleBlur}
        onChange={(event) => {
          const nextDisplayValue = formatPartialDateInput(event.target.value);
          const parsedValue = parseFormattedDate(nextDisplayValue);

          setDraftValue(nextDisplayValue);

          if (parsedValue) {
            onChange(parsedValue);
            return;
          }

          if (nextDisplayValue === "") {
            onChange("");
          }
        }}
        onFocus={(event) => {
          setDraftValue(formatDateValue(value));
          onFocus?.(event);
        }}
        type="text"
        value={displayValue}
      />
      <button
        aria-label={t("common.openDatePicker")}
        className={styles.pickerButton}
        disabled={isPickerDisabled}
        onClick={handleOpenPicker}
        title={t("common.openDatePicker")}
        type="button"
      >
        <CalendarDays aria-hidden="true" size={16} />
      </button>
      <input
        aria-hidden="true"
        className={styles.nativePickerInput}
        onChange={(event) => {
          setDraftValue(null);
          onChange(event.target.value);
        }}
        ref={pickerInputRef}
        tabIndex={-1}
        type="date"
        value={value}
      />
    </div>
  );
});

export default DateInput;
