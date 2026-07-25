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
};

export default function FilterTextInput({ id, label, value, placeholder, onChange, inputRef, inputAriaLabel }: FilterTextInputProps) {
  return (
    <Field htmlFor={id} label={label}>
      <Input
        aria-label={inputAriaLabel ?? label}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        ref={inputRef}
        value={value}
      />
    </Field>
  );
}
