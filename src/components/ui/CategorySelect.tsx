import { useMemo } from "react";
import type { CategoryOption } from "../../app/api/categories";
import { getStoredIcon } from "../../lib/icons";
import Select from "./Select";
import styles from "./CategorySelect.module.scss";

type CategorySelectProps = {
  id: string;
  value: string;
  options: CategoryOption[];
  placeholder: string;
  onChange: (value: string) => void;
  hasError?: boolean;
};

function CategoryContent({ category }: { category: CategoryOption }) {
  const Icon = getStoredIcon(category.icon);

  return (
    <span className={styles.value}>
      <span aria-hidden="true" className={styles.lead} style={category.color ? { color: category.color } : undefined}>
        {Icon ? <Icon className={styles.icon} /> : <span className={styles.dot} />}
      </span>
      <span className={styles.text}>{category.name}</span>
    </span>
  );
}

export default function CategorySelect({ id, value, options, placeholder, onChange, hasError = false }: CategorySelectProps) {
  const selectedOption = useMemo(() => options.find((option) => option.id === value) ?? null, [options, value]);

  const selectOptions = useMemo(() => options.map((option) => ({ value: option.id, label: option.name })), [options]);

  const renderOption = useMemo(
    () => (option: { value: string; label: string }) => {
      const category = options.find((o) => o.id === option.value);
      return category ? <CategoryContent category={category} /> : option.label;
    },
    [options],
  );

  return (
    <Select
      hasError={hasError}
      id={id}
      onValueChange={onChange}
      options={selectOptions}
      placeholder={placeholder}
      renderOption={renderOption}
      renderValue={() =>
        selectedOption ? <CategoryContent category={selectedOption} /> : <span className={styles.placeholder}>{placeholder}</span>
      }
      value={value}
    />
  );
}
