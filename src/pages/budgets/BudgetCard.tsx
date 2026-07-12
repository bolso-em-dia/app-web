import { useI18n } from "../../app/i18n/I18nContext";
import Card from "../../components/ui/Card";
import MoneyAmount from "../../components/ui/MoneyAmount";
import { formatCurrency } from "../../lib/formatters/currency";
import { formatReferenceMonth } from "../../lib/formatters/date";
import type { Budget } from "../../app/api/budgets";
import styles from "./BudgetsPage.module.scss";

interface BudgetCardProps {
  budget: Budget;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function BudgetCard({ budget, isSelected, onSelect }: BudgetCardProps) {
  const { t } = useI18n();

  return (
    <Card key={budget.id} className={styles.budgetCard}>
      <button
        className={styles.budgetButton}
        onClick={() => onSelect(budget.id)}
        type="button"
      >
        <div className={styles.budgetHeader}>
          <div>
            <strong>{budget.name}</strong>
            <p className={styles.budgetMeta}>
              {budget.type === "ALLOWANCE" && budget.ownerMemberName
                ? t("budgets.allowanceFor", {
                    name: budget.ownerMemberName,
                  })
                : t("budgets.linkedCategories", {
                    count: budget.categories.length,
                  })}
            </p>
          </div>
          <div className={styles.budgetAmounts}>
            <strong>{formatCurrency(budget.monthlyLimit)}</strong>
            <p className={styles.budgetMeta}>
              {t("budgets.consumed")}{" "}
              <MoneyAmount amount={budget.consumedAmount} type="EXPENSE" />
            </p>
          </div>
        </div>

        <div className={styles.badgeRow}>
          <span className={styles.badge}>
            {t(`budgetTypes.${budget.type}` as const)}
          </span>
          <span
            className={
              budget.archivedFromMonth
                ? `${styles.badge} ${styles.badgeMuted}`
                : `${styles.badge} ${styles.badgeSuccess}`
            }
          >
            {budget.archivedFromMonth
              ? t("budgets.archivedFrom", {
                  month: formatReferenceMonth(
                    budget.archivedFromMonth,
                  ),
                })
              : t("common.active")}
          </span>
        </div>
      </button>
    </Card>
  );
}
