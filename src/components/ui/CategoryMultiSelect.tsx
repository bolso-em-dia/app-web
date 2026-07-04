import type { CategoryOption } from "../../app/api/categories";
import { getStoredIcon } from "../../lib/icons";
import MultiSelect from "./MultiSelect";
import styles from "./CategorySelect.module.scss";

type CategoryMultiSelectProps = {
  id: string;
  value: string[];
  options: CategoryOption[];
  placeholder: string;
  onChange: (value: string[]) => void;
  hasError?: boolean;
};

function CategoryContent({ category }: { category: CategoryOption }) {
  const Icon = getStoredIcon(category.icon);

  return (
    <span className={styles.value}>
      <span
        aria-hidden="true"
        className={styles.lead}
        style={category.color ? { color: category.color } : undefined}
      >
        {Icon ? <Icon className={styles.icon} /> : <span className={styles.dot} />}
      </span>
      <span className={styles.text}>{category.name}</span>
    </span>
  );
}

export default function CategoryMultiSelect({
  id,
  value,
  options,
  placeholder,
  onChange,
  hasError = false,
}: CategoryMultiSelectProps) {
  return (
    <div className={styles.stack}>
      <MultiSelect
        getOptionValue={(option) => option.id}
        hasError={hasError}
        id={id}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        renderOption={(option) => <CategoryContent category={option} />}
        renderValue={(currentSelectedOptions) =>
          currentSelectedOptions.length > 0 ? (
            <span className={styles.triggerChipList}>
              {currentSelectedOptions.map((option) => {
                const category = options.find(
                  (currentOption) => currentOption.id === option.id,
                );

                return category ? (
                  <span className={styles.triggerChip} key={category.id}>
                    <CategoryContent category={category} />
                  </span>
                ) : null;
              })}
            </span>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )
        }
        value={value}
      />
    </div>
  );
}
