import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import type { Currency } from "../../lib/formatters/currency";
import { formatCurrencyInput, parseCurrencyInput } from "../../lib/formatters/currency";
import Input from "./Input";

type CurrencyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  hasError?: boolean;
  value: number | null | undefined;
  currency?: Currency;
  onValueChange: (value: number) => void;
};

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput(
  { hasError = false, onValueChange, value, currency, ...props },
  ref,
) {
  return (
    <Input
      {...props}
      ref={ref}
      hasError={hasError}
      inputMode="numeric"
      onChange={(event) => {
        onValueChange(parseCurrencyInput(event.target.value));
      }}
      type="text"
      value={formatCurrencyInput(value, currency)}
    />
  );
});

export default CurrencyInput;
