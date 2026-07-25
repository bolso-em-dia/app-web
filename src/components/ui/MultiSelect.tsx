import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const selectedValues = useMemo(() => new Set(value), [value]);
  const selectedOptions = useMemo(
    () => options.filter((option) => selectedValues.has(getOptionValue(option))),
    [getOptionValue, options, selectedValues],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, isOpen]);

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

  function closeMenu(restoreFocus = false) {
    setIsOpen(false);

    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }

  function openMenu(targetIndex: number) {
    setActiveIndex(targetIndex);
    setIsOpen(true);
  }

  function handleTriggerClick() {
    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu(
      Math.max(
        0,
        options.findIndex((option) => selectedValues.has(getOptionValue(option))),
      ),
    );
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const selectedIndex = Math.max(
      0,
      options.findIndex((option) => selectedValues.has(getOptionValue(option))),
    );

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(selectedIndex);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu(selectedIndex);
      return;
    }

    if (event.key === "Escape") {
      closeMenu();
    }
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.min(currentIndex + 1, options.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[activeIndex];

      if (option) {
        handleToggle(getOptionValue(option));
      }

      return;
    }

    if (event.key === "Tab") {
      closeMenu();
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={clsx(styles.trigger, isOpen ? styles.triggerOpen : "", hasError ? styles.error : "")}
        id={id}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
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

          {options.map((option, index) => {
            const optionValue = getOptionValue(option);
            const selected = selectedValues.has(optionValue);

            return (
              <button
                aria-selected={selected}
                className={clsx(styles.option, selected ? styles.optionSelected : "")}
                key={optionValue}
                onClick={() => handleToggle(optionValue)}
                onKeyDown={handleOptionKeyDown}
                role="option"
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                tabIndex={index === activeIndex ? 0 : -1}
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
