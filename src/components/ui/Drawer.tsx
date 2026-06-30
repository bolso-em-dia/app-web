import type { ReactNode } from "react";
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
  return (
    <>
      <button
        aria-label="Close drawer overlay"
        className={styles.backdrop}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-labelledby="drawer-title"
        aria-modal="true"
        className={styles.panel}
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
            className={styles.closeButton}
            onClick={onClose}
            type="button"
            variant="secondary"
          >
            Close
          </Button>
        </header>
        <div className={styles.body}>{children}</div>
      </aside>
    </>
  );
}
