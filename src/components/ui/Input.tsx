import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import clsx from "./clsx";
import styles from "./Input.module.scss";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError = false, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={clsx(styles.root, hasError ? styles.error : "", className)}
      {...props}
    />
  );
});

export default Input;
