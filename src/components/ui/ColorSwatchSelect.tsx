import clsx from "./clsx";
import styles from "./ColorSwatchSelect.module.scss";
import type { ColorOption } from "../../lib/uiOptions";
import Button from "./Button";

type ColorSwatchSelectProps = {
  id: string;
  value: string;
  options: ColorOption[];
  clearLabel: string;
  onChange: (value: string) => void;
};

export default function ColorSwatchSelect({
  id,
  value,
  options,
  clearLabel,
  onChange,
}: ColorSwatchSelectProps) {
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
          const inputId = `${id}-${option.value.slice(1)}`;

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
                aria-hidden="true"
                className={clsx(
                  styles.swatch,
                  value === option.value ? styles.selected : "",
                )}
                style={{ backgroundColor: option.value }}
              />
              <span className={styles.label}>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
