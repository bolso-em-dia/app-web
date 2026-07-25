import { type ReactNode, useCallback, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { useI18n } from "../../app/i18n/I18nContext";
import Button from "./Button";
import styles from "./Drawer.module.scss";

type DrawerProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  hideHeaderCloseButton?: boolean;
};

export default function Drawer({ title, onClose, children, hideHeaderCloseButton = false }: DrawerProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!panelRef.current) {
      return [];
    }

    return Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ),
    ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
  }, []);

  const getInitialFocusElement = useCallback(() => {
    if (!bodyRef.current) {
      return getFocusableElements()[0] ?? null;
    }

    const bodyFocusable = Array.from(
      bodyRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ),
    ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");

    return bodyFocusable[0] ?? getFocusableElements()[0] ?? null;
  }, [getFocusableElements]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusable = getFocusableElements();
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!first || !last) {
          return;
        }

        if (!panelRef.current.contains(document.activeElement)) {
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
    [getFocusableElements, onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.style.overflow = "hidden";

    const frameId = window.requestAnimationFrame(() => {
      const firstFocusable = getInitialFocusElement();

      if (firstFocusable) {
        firstFocusable.focus();
        return;
      }

      panelRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [getInitialFocusElement]);

  return (
    <>
      <button aria-label={t("common.closeDrawer")} className={styles.backdrop} onClick={onClose} type="button" />
      <aside aria-labelledby={titleId} aria-modal="true" className={styles.panel} ref={panelRef} role="dialog" tabIndex={-1}>
        <header className={styles.header}>
          <div>
            <h2 className={styles.title} id={titleId}>
              {title}
            </h2>
          </div>
          {!hideHeaderCloseButton ? (
            <Button aria-label={t("common.closeDrawer")} className={styles.closeButton} onClick={onClose} type="button" variant="subtle">
              <X aria-hidden="true" className={styles.closeIcon} />
            </Button>
          ) : null}
        </header>
        <div className={styles.body} ref={bodyRef}>
          {children}
        </div>
      </aside>
    </>
  );
}
