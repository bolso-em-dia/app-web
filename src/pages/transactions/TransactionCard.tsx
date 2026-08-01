import { Pin } from "lucide-react";
import { useI18n } from "../../app/i18n/I18nContext";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import MoneyAmount from "../../components/ui/MoneyAmount";
import styles from "./TransactionsPage.module.scss";
import type { Transaction } from "../../app/api/transactions";
import type { CategoryOption } from "../../app/api/categories";
import { renderStoredIcon } from "../../lib/icons";
import { formatDay } from "../../lib/formatters/date";
import { formatCurrency } from "../../lib/formatters/currency";

type TransactionCardProps = {
  transaction: Transaction;
  categoryOption: CategoryOption | undefined;
  isSelected?: boolean;
  onSelect: (id: string) => void;
};

export default function TransactionCard({ transaction, categoryOption, onSelect }: TransactionCardProps) {
  const { t } = useI18n();
  const categoryIcon = renderStoredIcon(categoryOption?.icon, styles.categoryIcon);
  const categoryColor = categoryOption?.color ?? undefined;
  const isFixedExpense = transaction.sourceType === "FIXED_EXPENSE";

  const cardContent = (
    <>
      <div className={styles.transactionTop}>
        <div className={styles.transactionSummary}>
          <strong className={styles.transactionDescription}>{transaction.description}</strong>
          <strong className={styles.transactionAmount}>
            <MoneyAmount amount={transaction.convertedAmount} type={transaction.type} />
          </strong>
        </div>
        <div className={styles.transactionMain}>
          <div className={styles.transactionTitleRow}>
            <span className={styles.transactionMeta}>
              {transaction.accountName} · {formatDay(transaction.transactionDate)}
              {transaction.currency === "USD" && transaction.exchangeRate != null
                ? ` · ${t("exchangeRate.reference", {
                    amount: formatCurrency(
                      transaction.type === "EXPENSE" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
                      "USD",
                    ),
                    rate: formatCurrency(transaction.exchangeRate),
                  })}`
                : null}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.badgeRow}>
        <Badge
          className={styles.categoryBadge}
          icon={
            categoryIcon ? (
              <span aria-hidden="true" className={styles.categoryLead} style={categoryColor ? { color: categoryColor } : undefined}>
                {categoryIcon}
              </span>
            ) : categoryColor ? (
              <span aria-hidden="true" className={styles.categoryLead} style={{ color: categoryColor }}>
                <span className={styles.categoryDot} />
              </span>
            ) : undefined
          }
          tone="info"
          truncate
        >
          {transaction.categoryName}
        </Badge>
        <Badge tone={transaction.type === "INCOME" ? "success" : "danger"}>{t(`transactionTypes.${transaction.type}` as const)}</Badge>
        <Badge>{t(`ownershipTypes.${transaction.ownershipType}` as const)}</Badge>
        {isFixedExpense ? (
          <Badge icon={<Pin />} tone="warning">
            {t("transactions.fixed")}
          </Badge>
        ) : null}
        {transaction.memberName ? <Badge tone="muted">{transaction.memberName}</Badge> : null}
        {transaction.installmentTotal ? (
          <Badge tone="muted">
            {transaction.installmentNumber}/{transaction.installmentTotal}
          </Badge>
        ) : null}
        {transaction.projected ? <Badge tone="muted">{t("transactions.projected")}</Badge> : null}
      </div>
    </>
  );

  return (
    <Card key={transaction.id} className={styles.transactionCard}>
      {transaction.projected ? (
        <div className={styles.transactionStatic} style={categoryColor ? { borderInlineStartColor: categoryColor } : undefined}>
          {cardContent}
        </div>
      ) : (
        <button
          className={styles.transactionButton}
          onClick={() => onSelect(transaction.id)}
          style={categoryColor ? { borderInlineStartColor: categoryColor } : undefined}
          type="button"
        >
          {cardContent}
        </button>
      )}
    </Card>
  );
}
