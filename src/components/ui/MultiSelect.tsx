import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import clsx from "./clsx";
import styles from "./MultiSelect.module.scss";

type MultiSelectProps<T> = {
  id: string;
  options: T[];
  value: string[];
  placeholder: string;
  onChange: (value: string[]) => void;
  getOptionValue: (option: T) => string;
  renderOption: (option: T, selected: boolean) => ReactNode;
  renderValue?: (selectedOptions: T[]) => ReactNode;
  emptyState?: ReactNode;
  hasError?: boolean;
};

export default function MultiSelect<T>({
  id,
  options,
  value,
  placeholder,
  onChange,
  getOptionValue,
  renderOption,
  renderValue,
  emptyState,
  hasError = false,
}: MultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const selectedValues = useMemo(() => new Set(value), [value]);
  const selectedOptions = useMemo(
    () => options.filter((option) => selectedValues.has(getOptionValue(option))),
    [getOptionValue, options, selectedValues],
  );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function handleToggle(optionValue: string) {
    if (selectedValues.has(optionValue)) {
      onChange(value.filter((currentValue) => currentValue !== optionValue));
      return;
    }

    onChange([...value, optionValue]);
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={clsx(styles.trigger, isOpen ? styles.triggerOpen : "", hasError ? styles.error : "")}
        id={id}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        type="button"
      >
        <span className={styles.triggerValue}>
          {renderValue ? (
            renderValue(selectedOptions)
          ) : selectedOptions.length > 0 ? (
            selectedOptions.map((option) => getOptionValue(option)).join(", ")
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </span>
        <span aria-hidden="true" className={styles.chevron}>
          ▾
        </span>
      </button>

      {isOpen ? (
        <div aria-multiselectable="true" className={styles.dropdown} id={listboxId} role="listbox">
          {options.length === 0 && emptyState ? <div className={styles.emptyState}>{emptyState}</div> : null}

          {options.map((option) => {
            const optionValue = getOptionValue(option);
            const selected = selectedValues.has(optionValue);

            return (
              <button
                aria-selected={selected}
                className={clsx(styles.option, selected ? styles.optionSelected : "")}
                key={optionValue}
                onClick={() => handleToggle(optionValue)}
                role="option"
                type="button"
              >
                {renderOption(option, selected)}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
