import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import {
  formatCurrencyInput,
  parseCurrencyInput,
} from "../../lib/formatters/currency";
import Input from "./Input";

type CurrencyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  hasError?: boolean;
  value: number | null | undefined;
  onValueChange: (value: number) => void;
};

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput(
    { hasError = false, onValueChange, value, ...props },
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
        value={formatCurrencyInput(value)}
      />
    );
  },
);

export default CurrencyInput;
