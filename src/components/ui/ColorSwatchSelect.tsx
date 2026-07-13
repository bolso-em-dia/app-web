import { useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "./clsx";
import styles from "./ColorSwatchSelect.module.scss";
import type { ColorOption } from "../../lib/uiOptions";

function getReadableTextColor(hexColor: string) {
  const normalized = hexColor.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance >= 150 ? "#111827" : "#ffffff";
}

type ColorSwatchSelectProps = {
  id: string;
  value: string;
  options: ColorOption[];
  clearLabel: string;
  onChange: (value: string) => void;
};

export default function ColorSwatchSelect({ id, value, options, clearLabel, onChange }: ColorSwatchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const selectedOption = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);

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
        <span
          aria-hidden="true"
          className={styles.preview}
          style={selectedOption ? { backgroundColor: selectedOption.value } : undefined}
        />
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
            <span aria-hidden="true" className={styles.preview} />
            <span className={styles.optionLabel}>{clearLabel}</span>
          </button>

          {options.map((option) => {
            const textColor = getReadableTextColor(option.value);

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
                style={{ backgroundColor: option.value, color: textColor }}
                type="button"
              >
                <span aria-hidden="true" className={styles.optionSwatch} style={{ backgroundColor: option.value }} />
                <span className={styles.optionLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
