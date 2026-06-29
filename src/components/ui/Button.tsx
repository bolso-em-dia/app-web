import type { ButtonHTMLAttributes } from "react";
import clsx from "./clsx";
import styles from "./Button.module.scss";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  loading?: boolean;
};

export default function Button({
  children,
  className,
  variant = "primary",
  fullWidth = false,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        styles.root,
        styles[variant],
        fullWidth ? styles.fullWidth : "",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
