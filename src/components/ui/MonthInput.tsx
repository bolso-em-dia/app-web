import { forwardRef, useState } from "react";
import type { FocusEvent, InputHTMLAttributes } from "react";
import { formatMonthValue, formatPartialMonthInput, parseFormattedMonth } from "../../lib/formatters/date";
import Input from "./Input";

type MonthInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "onChange" | "type" | "value"> & {
  hasError?: boolean;
  value: string;
  onChange: (value: string) => void;
};

const MonthInput = forwardRef<HTMLInputElement, MonthInputProps>(function MonthInput(
  { hasError = false, onBlur, onChange, onFocus, value, ...props },
  ref,
) {
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const displayValue = draftValue ?? formatMonthValue(value);

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const parsedValue = parseFormattedMonth(displayValue);

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
        const nextDisplayValue = formatPartialMonthInput(event.target.value);
        const parsedValue = parseFormattedMonth(nextDisplayValue);

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
        setDraftValue(formatMonthValue(value));
        onFocus?.(event);
      }}
      type="text"
      value={displayValue}
    />
  );
});

export default MonthInput;
