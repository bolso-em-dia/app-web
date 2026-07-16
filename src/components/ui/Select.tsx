import { Children, forwardRef, isValidElement, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode, SelectHTMLAttributes } from "react";
import clsx from "./clsx";
import styles from "./Select.module.scss";

type SelectOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

type RichSelectProps<TValue extends string> = {
  id: string;
  value: TValue;
  options: SelectOption<TValue>[];
  placeholder: string;
  onValueChange: (value: TValue) => void;
  renderOption?: (option: SelectOption<TValue>, selected: boolean) => ReactNode;
  renderValue?: (option: SelectOption<TValue> | null) => ReactNode;
  hasError?: boolean;
  className?: string;
};

type SelectProps<TValue extends string = string> = NativeSelectProps | RichSelectProps<TValue>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(props, ref) {
  if ("options" in props) {
    return <RichSelect {...props} />;
  }

  return <NativeSelect {...props} ref={ref} />;
});

const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(props, ref) {
  const {
    children,
    className,
    defaultValue,
    disabled = false,
    hasError = false,
    id,
    name,
    onBlur,
    onChange,
    required,
    value,
    ...nativeProps
  } = props;
  const extractedOptions = extractOptions(children);
  const placeholder = findPlaceholder(extractedOptions);
  const options = extractedOptions.filter((option) => option.value !== "");
  const isControlled = value !== undefined;
  const [derivedLabel, setDerivedLabel] = useState("");
  const [renderedValue, setRenderedValue] = useState(() => normalizeValue(value ?? defaultValue));
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const selectedOption = options.find((option) => option.value === renderedValue) ?? null;

  useEffect(() => {
    if (!id) {
      return;
    }

    const label = document.querySelector(`label[for="${id}"]`);

    if (label instanceof HTMLLabelElement) {
      const labelText = Array.from(label.childNodes)
        .map((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent ?? "";
          }

          if (node instanceof HTMLDivElement) {
            return "";
          }

          return node.textContent ?? "";
        })
        .join(" ");

      setDerivedLabel(labelText?.trim() ?? "");
    }
  }, [id]);

  useEffect(() => {
    if (isControlled) {
      setRenderedValue(normalizeValue(value));
      return;
    }

    const nextValue = selectRef.current?.value;

    if (nextValue !== undefined && nextValue !== renderedValue) {
      setRenderedValue(nextValue);
    }
  }, [isControlled, renderedValue, value]);

  return (
    <div className={clsx(styles.richRoot, styles.nativeRoot, className)}>
      <div
        aria-hidden="true"
        className={clsx(styles.richTrigger, hasError ? styles.error : "", disabled ? styles.nativeTriggerDisabled : "")}
      >
        <span className={styles.richValue}>
          {selectedOption ? selectedOption.label : <span className={styles.placeholder}>{placeholder}</span>}
        </span>
        <span aria-hidden="true" className={styles.chevron}>
          ▾
        </span>
      </div>
      <select
        {...nativeProps}
        aria-label={nativeProps["aria-label"] ?? (derivedLabel || undefined)}
        className={styles.nativeSelectOverlay}
        defaultValue={isControlled ? undefined : defaultValue}
        disabled={disabled}
        id={id}
        name={name}
        onBlur={onBlur}
        onChange={(event) => {
          setRenderedValue(event.target.value);
          onChange?.(event);
        }}
        ref={(node) => {
          selectRef.current = node;

          if (typeof ref === "function") {
            ref(node);
            return;
          }

          if (ref) {
            ref.current = node;
          }
        }}
        required={required}
        value={isControlled ? value : undefined}
      >
        {children}
      </select>
    </div>
  );
});

type RichSelectInternalProps<TValue extends string> = RichSelectProps<TValue> & {
  buttonAriaLabel?: string;
  buttonAriaLabelledBy?: string;
  dataTestId?: string;
  disabled?: boolean;
  includePlaceholderOption?: boolean;
  onBlur?: () => void;
};

function RichSelect<TValue extends string>({
  buttonAriaLabel,
  buttonAriaLabelledBy,
  id,
  value,
  options,
  placeholder,
  onValueChange,
  renderOption,
  renderValue,
  hasError = false,
  className,
  dataTestId,
  disabled = false,
  includePlaceholderOption = true,
  onBlur,
}: RichSelectInternalProps<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value) ?? null;
  const renderedOptions = includePlaceholderOption ? [{ value: "" as TValue, label: placeholder }, ...options] : options;

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

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    const selectedIndex = Math.max(
      0,
      renderedOptions.findIndex((option) => option.value === value),
    );

    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenu(selectedIndex);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(selectedIndex);
      return;
    }

    if (event.key === "Escape") {
      closeMenu();
    }
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>, optionIndex: number) {
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

    if (event.key === "Tab") {
      setActiveIndex(optionIndex);
      closeMenu();
    }
  }

  return (
    <div className={clsx(styles.richRoot, className)} ref={rootRef}>
      <button
        aria-label={buttonAriaLabel}
        aria-labelledby={buttonAriaLabelledBy}
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={clsx(styles.richTrigger, isOpen ? styles.richTriggerOpen : "", hasError ? styles.error : "")}
        data-testid={dataTestId}
        disabled={disabled}
        id={id}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
            onBlur?.();
          }
        }}
        onClick={() => {
          if (!disabled) {
            setIsOpen((open) => !open);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
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
          {renderedOptions.map((option, optionIndex) => {
            const selected = value === option.value;

            return (
              <button
                aria-selected={selected}
                className={clsx(styles.option, selected ? styles.optionSelected : "")}
                key={option.value}
                onKeyDown={(event) => handleOptionKeyDown(event, optionIndex)}
                onClick={() => {
                  onValueChange(option.value);
                  closeMenu(true);
                }}
                ref={(node) => {
                  optionRefs.current[optionIndex] = node;
                }}
                role="option"
                tabIndex={optionIndex === activeIndex ? 0 : -1}
                type="button"
              >
                {option.value === "" ? placeholder : renderOption ? renderOption(option, selected) : option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function extractOptions(children: ReactNode): Array<SelectOption<string>> {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child) || child.type !== "option") {
      return [];
    }

    return [
      {
        label: getOptionLabel(child.props.children),
        value: normalizeValue(child.props.value),
      },
    ];
  });
}

function getOptionLabel(content: ReactNode): string {
  return Children.toArray(content)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      return "";
    })
    .join("")
    .trim();
}

function findPlaceholder(options: Array<SelectOption<string>>): string {
  return options.find((option) => option.value === "")?.label ?? "";
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

export default Select;
