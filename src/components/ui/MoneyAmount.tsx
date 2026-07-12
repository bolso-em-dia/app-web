import { memo } from "react";
import { formatCurrency } from "../../lib/formatters/currency";
import styles from "./MoneyAmount.module.scss";

type TransactionType = "INCOME" | "EXPENSE";

type MoneyAmountProps = {
  amount: number;
  type: TransactionType;
  as?: "span" | "strong";
  className?: string;
};

export default memo(function MoneyAmount({
  amount,
  type,
  as: Tag = "span",
  className,
}: MoneyAmountProps) {
  const isZero = amount === 0;
  const signedAmount = isZero
    ? 0
    : type === "EXPENSE"
      ? -Math.abs(amount)
      : Math.abs(amount);
  const colorClass = isZero ? "" : type === "EXPENSE" ? styles.expense : styles.income;

  return (
    <Tag className={`${colorClass} ${className ?? ""}`.trim()}>
      {formatCurrency(signedAmount)}
    </Tag>
  );
});
