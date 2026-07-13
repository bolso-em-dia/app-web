import Field from "../Field";
import Input from "../Input";

type FilterTextInputProps = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export default function FilterTextInput({ id, label, value, placeholder, onChange }: FilterTextInputProps) {
  return (
    <Field htmlFor={id} label={label}>
      <Input id={id} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </Field>
  );
}
