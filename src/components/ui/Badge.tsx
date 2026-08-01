import { memo, type ComponentPropsWithoutRef, type ReactNode } from "react";
import clsx from "./clsx";
import styles from "./Badge.module.scss";

type BadgeTone = "default" | "muted" | "success" | "danger" | "warning" | "info";

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  icon?: ReactNode;
  tone?: BadgeTone;
  truncate?: boolean;
};

const toneClassNames: Record<BadgeTone, string> = {
  default: styles.default,
  muted: styles.muted,
  success: styles.success,
  danger: styles.danger,
  warning: styles.warning,
  info: styles.info,
};

export default memo(function Badge({ children, className, icon, tone = "default", truncate = false, ...props }: BadgeProps) {
  return (
    <span {...props} className={clsx(styles.root, toneClassNames[tone], truncate ? styles.truncate : "", className)}>
      {icon ? (
        <span aria-hidden="true" className={styles.icon}>
          {icon}
        </span>
      ) : null}
      <span className={styles.label}>{children}</span>
    </span>
  );
});
