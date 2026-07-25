import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import clsx from "./clsx";
import styles from "./IconSelect.module.scss";
import { getStoredIcon } from "../../lib/icons";
import type { IconOption } from "../../lib/uiOptions";

type RenderedIconOption = IconOption | { value: ""; label: string };

type IconSelectProps = {
  id: string;
  value: string;
  options: IconOption[];
  clearLabel: string;
  onChange: (value: string) => void;
};

export default function IconSelect({ id, value, options, clearLabel, onChange }: IconSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const selectedOption = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);
  const SelectedIcon = getStoredIcon(selectedOption?.value);

  const renderedOptions = useMemo<RenderedIconOption[]>(() => [{ value: "", label: clearLabel }, ...options], [clearLabel, options]);

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
        renderedOptions.findIndex((option) => option.value === value),
      ),
    );
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const selectedIndex = Math.max(
      0,
      renderedOptions.findIndex((option) => option.value === value),
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
      setActiveIndex((currentIndex) => Math.min(currentIndex + 1, renderedOptions.length - 1));
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
      setActiveIndex(renderedOptions.length - 1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = renderedOptions[activeIndex];

      if (option) {
        onChange(option.value);
        closeMenu(true);
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
        className={clsx(styles.trigger, isOpen ? styles.triggerOpen : "")}
        id={id}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span aria-hidden="true" className={styles.preview}>
          {SelectedIcon ? <SelectedIcon className={styles.icon} /> : "-"}
        </span>
        <span className={styles.triggerLabel}>{selectedOption?.label ?? clearLabel}</span>
        <span aria-hidden="true" className={styles.chevron}>
          ▾
        </span>
      </button>

      {isOpen ? (
        <div className={styles.dropdown} id={listboxId} role="listbox">
          {renderedOptions.map((option, optionIndex) => {
            const Icon = getStoredIcon(option.value);
            const selected = value === option.value;

            return (
              <button
                aria-selected={selected}
                className={clsx(styles.option, selected ? styles.optionSelected : "")}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  closeMenu(true);
                }}
                onKeyDown={handleOptionKeyDown}
                ref={(node) => {
                  optionRefs.current[optionIndex] = node;
                }}
                role="option"
                tabIndex={optionIndex === activeIndex ? 0 : -1}
                type="button"
              >
                <span aria-hidden="true" className={styles.preview}>
                  {Icon ? <Icon className={styles.icon} /> : "-"}
                </span>
                <span className={styles.optionLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
