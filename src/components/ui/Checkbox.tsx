import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import clsx from "./clsx";
import styles from "./Checkbox.module.scss";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, ...props },
  ref,
) {
  return (
    <label className={clsx(styles.root, className)}>
      <input ref={ref} className={styles.input} type="checkbox" {...props} />
      <span className={styles.label}>{label}</span>
    </label>
  );
});

export default Checkbox;
