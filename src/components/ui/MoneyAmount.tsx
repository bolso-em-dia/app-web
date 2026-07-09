import { formatCurrency } from "../../lib/formatters/currency";
import styles from "./MoneyAmount.module.scss";

type TransactionType = "INCOME" | "EXPENSE";

type MoneyAmountProps = {
  amount: number;
  type: TransactionType;
  as?: "span" | "strong";
  className?: string;
};

export default function MoneyAmount({
  amount,
  type,
  as: Tag = "span",
  className,
}: MoneyAmountProps) {
  const signedAmount = type === "EXPENSE" ? -Math.abs(amount) : Math.abs(amount);
  const colorClass = type === "EXPENSE" ? styles.expense : styles.income;

  return (
    <Tag className={`${colorClass} ${className ?? ""}`.trim()}>
      {formatCurrency(signedAmount)}
    </Tag>
  );
}
