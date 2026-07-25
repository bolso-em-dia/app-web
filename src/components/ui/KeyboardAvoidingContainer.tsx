import { type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import useKeyboardAvoidance from "../../lib/useKeyboardAvoidance";
import clsx from "./clsx";
import styles from "./KeyboardAvoidingContainer.module.scss";

type KeyboardAvoidingContainerProps = {
  /**
   * When `true` (default), tracks the on-screen keyboard and lifts the container
   * above it. When `false`, listeners are detached and the container stays at
   * its resting bottom offset.
   */
  enabled?: boolean;
  /**
   * When `true` (default), the container rests above the mobile action bar while
   * the keyboard is closed (uses `--mobile-action-bar-height`). Set to `false`
   * for containers that should rest directly at the bottom of the viewport.
   */
  reserveActionBarSpace?: boolean;
  /** Accessibility role forwarded to the rendered element (e.g. `"search"`). */
  role?: string;
  /** Extra class names for visual styling (background, padding, z-index, grid). */
  className?: string;
  /**
   * Optional inline styles, merged after the keyboard-tracking custom properties
   * so consumers can augment (but not wipe) the avoidance behavior.
   */
  style?: CSSProperties;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "role" | "style">;

/**
 * Fixed bottom container that lifts itself above the on-screen keyboard.
 *
 * Owns only `position: fixed` and the dynamic `bottom` offset (via the
 * `--keyboard-inset` / `--keyboard-active` custom properties produced by
 * {@link useKeyboardAvoidance}). Consumers provide visual styling (background,
 * border, shadow, padding, min-height, grid, z-index) through `className`.
 *
 * Consumers MUST NOT redefine `position`, `right`, `bottom`, or `left` in their
 * own class, otherwise the keyboard avoidance breaks.
 */
export default function KeyboardAvoidingContainer({
  enabled = true,
  reserveActionBarSpace = true,
  role,
  className,
  style,
  children,
  ...rest
}: KeyboardAvoidingContainerProps) {
  const { dockStyle } = useKeyboardAvoidance(enabled);

  return (
    <div
      className={clsx(styles.container, !reserveActionBarSpace && styles.noActionBarSpace, className)}
      role={role}
      style={{ ...dockStyle, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
