import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import clsx from "./clsx";
import styles from "./Select.module.scss";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, hasError = false, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={clsx(styles.root, hasError ? styles.error : "", className)}
      {...props}
    />
  );
});

export default Select;
