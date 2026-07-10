import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useI18n } from "../../app/i18n/I18nContext";
import Button from "./Button";
import styles from "./Drawer.module.scss";

type DrawerProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function Drawer({
  title,
  description,
  onClose,
  children,
}: DrawerProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
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
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <button
        aria-label={t("common.closeDrawer")}
        className={styles.backdrop}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-labelledby="drawer-title"
        aria-modal="true"
        className={styles.panel}
        ref={panelRef}
        role="dialog"
      >
        <header className={styles.header}>
          <div>
            <h2 className={styles.title} id="drawer-title">
              {title}
            </h2>
            {description ? (
              <p className={styles.description}>{description}</p>
            ) : null}
          </div>
          <Button
            aria-label={t("common.closeDrawer")}
            className={styles.closeButton}
            onClick={onClose}
            type="button"
            variant="subtle"
          >
            <X aria-hidden="true" className={styles.closeIcon} />
          </Button>
        </header>
        <div className={styles.body}>{children}</div>
      </aside>
    </>
  );
}
