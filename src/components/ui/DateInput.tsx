import { forwardRef, useState } from "react";
import type { FocusEvent, InputHTMLAttributes } from "react";
import { formatDateValue, formatPartialDateInput, parseFormattedDate } from "../../lib/formatters/date";
import Input from "./Input";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "onChange" | "type" | "value"> & {
  hasError?: boolean;
  value: string;
  onChange: (value: string) => void;
};

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { hasError = false, onBlur, onChange, onFocus, value, ...props },
  ref,
) {
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const displayValue = draftValue ?? formatDateValue(value);

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
  );
});

export default DateInput;
