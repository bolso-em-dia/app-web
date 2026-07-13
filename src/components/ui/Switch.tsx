import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import clsx from "./clsx";
import styles from "./Switch.module.scss";

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch({ className, id, label, ...props }, ref) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={clsx(styles.root, className)}>
      <input ref={ref} className={styles.input} id={inputId} role="switch" type="checkbox" {...props} />
      <label className={styles.control} htmlFor={inputId}>
        <span aria-hidden="true" className={styles.track}>
          <span className={styles.thumb} />
        </span>
        <span className={styles.label}>{label}</span>
      </label>
    </div>
  );
});

export default Switch;
