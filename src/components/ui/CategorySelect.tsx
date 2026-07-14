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

export default function CategorySelect({ id, value, options, placeholder, onChange, hasError = false }: CategorySelectProps) {
  const selectOptions = useMemo(() => options.map((option) => ({ value: option.id, label: option.name })), [options]);

  const renderOption = useMemo(
    () => (option: { value: string; label: string }) => {
      const category = options.find((currentOption) => currentOption.id === option.value);
      if (!category) {
        return option.label;
      }

      const Icon = getStoredIcon(category.icon);

      return (
        <span className={styles.value}>
          <span aria-hidden="true" className={styles.lead} style={category.color ? { color: category.color } : undefined}>
            {Icon ? <Icon className={styles.icon} /> : <span className={styles.dot} />}
          </span>
          <span className={styles.text}>{category.name}</span>
        </span>
      );
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
      renderValue={(option) => (option ? renderOption(option) : <span className={styles.placeholder}>{placeholder}</span>)}
      value={value}
    />
  );
}
