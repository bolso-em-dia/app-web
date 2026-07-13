import { useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "./clsx";
import styles from "./IconSelect.module.scss";
import { getStoredIcon } from "../../lib/icons";
import type { IconOption } from "../../lib/uiOptions";

type IconSelectProps = {
  id: string;
  value: string;
  options: IconOption[];
  clearLabel: string;
  onChange: (value: string) => void;
};

export default function IconSelect({ id, value, options, clearLabel, onChange }: IconSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const selectedOption = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);
  const SelectedIcon = getStoredIcon(selectedOption?.value);

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
    <div className={styles.root} ref={rootRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={clsx(styles.trigger, isOpen ? styles.triggerOpen : "")}
        id={id}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
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
          <button
            aria-selected={value === ""}
            className={clsx(styles.option, value === "" ? styles.optionSelected : "")}
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            role="option"
            type="button"
          >
            <span aria-hidden="true" className={styles.preview}>
              -
            </span>
            <span className={styles.optionLabel}>{clearLabel}</span>
          </button>

          {options.map((option) => {
            const Icon = getStoredIcon(option.value);

            return (
              <button
                aria-selected={value === option.value}
                className={clsx(styles.option, value === option.value ? styles.optionSelected : "")}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                role="option"
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
