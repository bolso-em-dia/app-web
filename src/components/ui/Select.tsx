import { forwardRef, useEffect, useId, useRef, useState } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import clsx from "./clsx";
import styles from "./Select.module.scss";

type RichSelectOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

type RichSelectProps<TValue extends string> = {
  id: string;
  value: TValue;
  options: RichSelectOption<TValue>[];
  placeholder: string;
  onValueChange: (value: TValue) => void;
  renderOption?: (option: RichSelectOption<TValue>, selected: boolean) => ReactNode;
  renderValue?: (option: RichSelectOption<TValue> | null) => ReactNode;
  hasError?: boolean;
  className?: string;
};

type SelectProps<TValue extends string = string> = NativeSelectProps | RichSelectProps<TValue>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(props, ref) {
  if ("options" in props) {
    return <RichSelect {...props} />;
  }

  const { className, hasError = false, ...nativeProps } = props;

  return <select ref={ref} className={clsx(styles.root, hasError ? styles.error : "", className)} {...nativeProps} />;
});

function RichSelect<TValue extends string>({
  id,
  value,
  options,
  placeholder,
  onValueChange,
  renderOption,
  renderValue,
  hasError = false,
  className,
}: RichSelectProps<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value) ?? null;

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

  return (
    <div className={clsx(styles.richRoot, className)} ref={rootRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={clsx(styles.richTrigger, isOpen ? styles.richTriggerOpen : "", hasError ? styles.error : "")}
        id={id}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        type="button"
      >
        <span className={styles.richValue}>
          {renderValue ? (
            renderValue(selectedOption)
          ) : selectedOption ? (
            selectedOption.label
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </span>
        <span aria-hidden="true" className={styles.chevron}>
          ▾
        </span>
      </button>

      {isOpen ? (
        <div className={styles.dropdown} id={listboxId} role="listbox">
          <button
            aria-selected={value === ""}
            className={clsx(styles.option, value === "" ? styles.optionSelected : "")}
            onClick={() => {
              onValueChange("" as TValue);
              setIsOpen(false);
            }}
            role="option"
            type="button"
          >
            {placeholder}
          </button>

          {options.map((option) => {
            const selected = value === option.value;

            return (
              <button
                aria-selected={selected}
                className={clsx(styles.option, selected ? styles.optionSelected : "")}
                key={option.value}
                onClick={() => {
                  onValueChange(option.value);
                  setIsOpen(false);
                }}
                role="option"
                type="button"
              >
                {renderOption ? renderOption(option, selected) : option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default Select;
