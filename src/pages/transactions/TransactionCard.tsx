import { useI18n } from "../../app/i18n/I18nContext";
import Card from "../../components/ui/Card";
import MoneyAmount from "../../components/ui/MoneyAmount";
import styles from "./TransactionsPage.module.scss";
import type { Transaction } from "../../app/api/transactions";
import type { CategoryOption } from "../../app/api/categories";
import { getStoredIcon } from "../../lib/icons";
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
  const CategoryIcon = getStoredIcon(categoryOption?.icon);
  const categoryColor = categoryOption?.color ?? undefined;

  const cardContent = (
    <>
      <div className={styles.transactionTop}>
        <div className={styles.transactionMain}>
          <div className={styles.transactionTitleRow}>
            {CategoryIcon ? (
              <span aria-hidden="true" className={styles.categoryLead} style={categoryColor ? { color: categoryColor } : undefined}>
                <CategoryIcon className={styles.categoryIcon} />
              </span>
            ) : categoryColor ? (
              <span aria-hidden="true" className={styles.categoryLead} style={{ color: categoryColor }}>
                <span className={styles.categoryDot} />
              </span>
            ) : null}
            <div className={styles.transactionLine}>
              <strong className={styles.transactionDescription}>{transaction.description}</strong>
              <span className={styles.transactionMetaSeparator}>·</span>
              <span className={styles.transactionMeta}>
                {transaction.categoryName} · {transaction.accountName} · {formatDay(transaction.transactionDate)}
                {transaction.currency === "USD" && transaction.exchangeRate != null
                  ? ` · ${formatCurrency(
                      transaction.type === "EXPENSE" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
                      "USD",
                    )} (cot. ${transaction.exchangeRate.toFixed(2)})`
                  : null}
              </span>
            </div>
          </div>
        </div>
        <strong className={styles.transactionAmount}>
          <MoneyAmount amount={transaction.convertedAmount} type={transaction.type} />
        </strong>
      </div>

      <div className={styles.badgeRow}>
        <span className={`${styles.badge} ${transaction.type === "INCOME" ? styles.badgeIncome : styles.badgeExpense}`}>
          {t(`transactionTypes.${transaction.type}` as const)}
        </span>
        <span className={styles.badge}>{t(`ownershipTypes.${transaction.ownershipType}` as const)}</span>
        {transaction.memberName ? <span className={`${styles.badge} ${styles.badgeMuted}`}>{transaction.memberName}</span> : null}
        {transaction.installmentTotal ? (
          <span className={`${styles.badge} ${styles.badgeMuted}`}>
            {transaction.installmentNumber}/{transaction.installmentTotal}
          </span>
        ) : null}
        {transaction.projected ? <span className={`${styles.badge} ${styles.badgeMuted}`}>{t("transactions.projected")}</span> : null}
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
