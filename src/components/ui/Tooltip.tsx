import { useId, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import clsx from "./clsx";
import styles from "./Tooltip.module.scss";

type TooltipProps = {
  content: string;
  className?: string;
  children?: ReactNode;
};

export default function Tooltip({
  content,
  className,
  children,
}: TooltipProps) {
  const tooltipId = useId();

  return (
    <span className={clsx(styles.root, className)}>
      <button
        aria-describedby={tooltipId}
        aria-label={content}
        className={styles.trigger}
        type="button"
      >
        {children ?? <CircleHelp aria-hidden="true" className={styles.icon} />}
      </button>
      <span className={styles.content} id={tooltipId} role="tooltip">
        {content}
      </span>
    </span>
  );
}
