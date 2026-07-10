import type { Currency } from "../../lib/formatters/currency";
import { formatCurrency } from "../../lib/formatters/currency";
import styles from "./MoneyAmount.module.scss";

type TransactionType = "INCOME" | "EXPENSE";

type MoneyAmountProps = {
  amount: number;
  type: TransactionType;
  as?: "span" | "strong";
  className?: string;
  originalAmount?: number | null;
  currency?: Currency | null;
};

export default function MoneyAmount({
  amount,
  type,
  as: Tag = "span",
  className,
  originalAmount,
  currency: txCurrency,
}: MoneyAmountProps) {
  const isZero = amount === 0;
  const signedAmount = isZero ? 0 : type === "EXPENSE" ? -Math.abs(amount) : Math.abs(amount);
  const colorClass = isZero ? "" : type === "EXPENSE" ? styles.expense : styles.income;
  const showForeign =
    txCurrency === "USD" && originalAmount != null && originalAmount > 0;

  if (showForeign) {
    const rate = originalAmount > 0 ? Math.abs(amount) / originalAmount : 0;
    return (
      <span className={styles.foreignBlock}>
        <Tag className={`${colorClass} ${className ?? ""}`.trim()}>
          {formatCurrency(signedAmount)}
        </Tag>
        <span className={styles.foreignMeta}>
          {formatCurrency(
            type === "EXPENSE" ? -Math.abs(originalAmount) : Math.abs(originalAmount),
            "USD",
          )}
          {" · "}
          cot. {rate.toFixed(2)}
        </span>
      </span>
    );
  }

  return (
    <Tag className={`${colorClass} ${className ?? ""}`.trim()}>
      {formatCurrency(signedAmount)}
    </Tag>
  );
}
