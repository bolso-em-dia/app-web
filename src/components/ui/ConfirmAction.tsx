import type { ReactNode } from "react";
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

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        aria-label={cancelLabel ?? t("common.cancel")}
        className={styles.backdrop}
        onClick={onCancel}
        type="button"
      />
      <aside
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        className={styles.dialog}
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
