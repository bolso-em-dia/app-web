import type { Ref } from "react";
import Field from "../Field";
import Input from "../Input";

type FilterTextInputProps = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  inputAriaLabel?: string;
  onBlur?: () => void;
  onFocus?: () => void;
};

export default function FilterTextInput({
  id,
  label,
  value,
  placeholder,
  onChange,
  inputRef,
  inputAriaLabel,
  onBlur,
  onFocus,
}: FilterTextInputProps) {
  return (
    <Field htmlFor={id} label={label}>
      <Input
        aria-label={inputAriaLabel ?? label}
        id={id}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        ref={inputRef}
        value={value}
      />
    </Field>
  );
}
