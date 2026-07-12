import { memo } from "react";
import type { ReactNode } from "react";
import clsx from "./clsx";
import styles from "./Card.module.scss";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default memo(function Card({ children, className }: CardProps) {
  return <section className={clsx(styles.root, className)}>{children}</section>;
});
