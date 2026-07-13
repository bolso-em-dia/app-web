import type { CategoryOption } from "../../../app/api/categories";
import type { FilterOption } from "../../../lib/filterFields";
import CategoryMultiSelect from "../CategoryMultiSelect";
import Field from "../Field";

type FilterCategoryMultiInputProps = {
  id: string;
  label: string;
  value: string[];
  options: FilterOption<string, CategoryOption>[];
  placeholder: string;
  onChange: (value: string[]) => void;
};

export default function FilterCategoryMultiInput({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
}: FilterCategoryMultiInputProps) {
  const rawOptions = options.flatMap((option) =>
    option.raw ? [option.raw] : [],
  );

  return (
    <Field htmlFor={id} label={label}>
      <CategoryMultiSelect
        id={id}
        onChange={onChange}
        options={rawOptions}
        placeholder={placeholder}
        value={value}
      />
    </Field>
  );
}
