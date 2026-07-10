import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { useI18n } from "../../app/i18n/I18nContext";
import Button from "./Button";
import styles from "./ConfirmAction.module.scss";

type ConfirmActionProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger";
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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open || loading) {
        return;
      }

      if (event.key === "Escape") {
        event.stopPropagation();
        onCancel();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!first || !last) {
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
    [open, loading, onCancel],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        aria-label={cancelLabel ?? t("common.cancel")}
        className={styles.backdrop}
        disabled={loading}
        onClick={onCancel}
        type="button"
      />
      <aside
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        className={styles.dialog}
        ref={dialogRef}
        role="alertdialog"
      >
        <div className={styles.content}>
          <h2 className={styles.title} id="confirm-action-title">
            {title}
          </h2>
          <p className={styles.message}>{message}</p>
          {children}
          <div className={styles.actions}>
            <Button
              autoFocus
              disabled={loading}
              onClick={onCancel}
              type="button"
              variant="secondary"
            >
              {cancelLabel ?? t("common.cancel")}
            </Button>
            <Button
              loading={loading}
              onClick={onConfirm}
              type="button"
              variant={variant}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
