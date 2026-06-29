import type { ReactNode } from "react";
import styles from "./Field.module.scss";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
};

export default function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <label className={styles.root} htmlFor={htmlFor}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
}
