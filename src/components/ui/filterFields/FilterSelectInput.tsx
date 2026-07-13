import Field from "../Field";
import Select from "../Select";
import type { FilterOption } from "../../../lib/filterFields";

type FilterSelectInputProps<TValue extends string = string> = {
  id: string;
  label: string;
  value: TValue | "";
  options: FilterOption<TValue>[];
  placeholder: string;
  onChange: (value: TValue | "") => void;
};

export default function FilterSelectInput<TValue extends string = string>({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
}: FilterSelectInputProps<TValue>) {
  return (
    <Field htmlFor={id} label={label}>
      <Select id={id} onChange={(event) => onChange(event.target.value as TValue | "")} value={value}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}
