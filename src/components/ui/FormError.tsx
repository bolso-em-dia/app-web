import type { ReactNode } from "react";
import styles from "./FormError.module.scss";

type FormErrorProps = {
  children: ReactNode;
};

export default function FormError({ children }: FormErrorProps) {
  if (!children) {
    return null;
  }

  return (
    <p className={styles.root} role="alert">
      {children}
    </p>
  );
}
