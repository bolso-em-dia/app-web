import { type ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef } from "react";
import { useI18n } from "../../app/i18n/I18nContext";
import Button from "./Button";
import styles from "./ConfirmAction.module.scss";

type ConfirmActionProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "primary" | "secondary" | "subtle" | "danger";
  loading?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmAction({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  loading = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmActionProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const getFocusableElements = useCallback(() => {
    if (!dialogRef.current) {
      return [];
    }

    return Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ),
    );
  }, []);

  const restoreFocus = useCallback(() => {
    const trigger = restoreFocusRef.current;

    if (!trigger) {
      return;
    }

    trigger.focus();
    restoreFocusRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    restoreFocus();
    onCancel();
  }, [onCancel, restoreFocus]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open || loading) {
        return;
      }

      if (event.key === "Escape") {
        event.stopPropagation();
        handleCancel();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = getFocusableElements();
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!first || !last) {
          return;
        }

        if (!dialogRef.current.contains(document.activeElement)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
          return;
        }

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    },
    [getFocusableElements, handleCancel, loading, open],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    function handleFocusIn(event: FocusEvent) {
      if (!open && event.target instanceof HTMLElement) {
        restoreFocusRef.current = event.target;
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (!open && event.target instanceof HTMLElement) {
        const trigger = event.target.closest<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
        restoreFocusRef.current = trigger ?? event.target;
      }
    }

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      getFocusableElements()[0]?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [getFocusableElements, open]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden="true"
        className={styles.backdrop}
        data-testid="confirm-action-backdrop"
        onClick={loading ? undefined : handleCancel}
      />
      <aside aria-modal="true" aria-labelledby={titleId} className={styles.dialog} ref={dialogRef} role="alertdialog" tabIndex={-1}>
        <div className={styles.content}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
          <p className={styles.message}>{message}</p>
          {children}
          <div className={styles.actions}>
            <Button autoFocus disabled={loading} onClick={handleCancel} type="button" variant="secondary">
              {cancelLabel ?? t("common.cancel")}
            </Button>
            <Button loading={loading} onClick={onConfirm} type="button" variant={variant}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
