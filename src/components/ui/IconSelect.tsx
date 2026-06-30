import clsx from "./clsx";
import styles from "./IconSelect.module.scss";
import type { IconOption } from "../../lib/uiOptions";
import Button from "./Button";

type IconSelectProps = {
  id: string;
  value: string;
  options: IconOption[];
  clearLabel: string;
  onChange: (value: string) => void;
};

export default function IconSelect({
  id,
  value,
  options,
  clearLabel,
  onChange,
}: IconSelectProps) {
  return (
    <div className={styles.stack}>
      <Button
        className={styles.clearButton}
        onClick={() => onChange("")}
        type="button"
        variant="secondary"
      >
        {clearLabel}
      </Button>

      <div className={styles.grid} id={id} role="radiogroup">
        {options.map((option) => {
          const inputId = `${id}-${option.value}`;

          return (
            <label
              className={styles.option}
              htmlFor={inputId}
              key={option.value}
            >
              <input
                checked={value === option.value}
                className={styles.radio}
                id={inputId}
                name={id}
                onChange={() => onChange(option.value)}
                type="radio"
                value={option.value}
              />
              <span
                className={clsx(
                  styles.card,
                  value === option.value ? styles.selected : "",
                )}
              >
                <span className={styles.preview}>{option.preview}</span>
                <span className={styles.label}>{option.label}</span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
