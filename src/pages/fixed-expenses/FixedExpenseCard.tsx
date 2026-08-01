import { useI18n } from "../../app/i18n/I18nContext";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import MoneyAmount from "../../components/ui/MoneyAmount";
import type { FixedExpenseTemplate } from "../../app/api/fixedExpenses";
import type { CategoryOption } from "../../app/api/categories";
import { renderStoredIcon } from "../../lib/icons";
import { formatReferenceMonth } from "../../lib/formatters/date";
import { formatCurrency } from "../../lib/formatters/currency";
import styles from "./FixedExpensesPage.module.scss";

interface FixedExpenseCardProps {
  template: FixedExpenseTemplate;
  categoryOption: CategoryOption | undefined;
  isSelected?: boolean;
  onSelect: (id: string) => void;
}

export default function FixedExpenseCard({ template, categoryOption, onSelect }: FixedExpenseCardProps) {
  const { t } = useI18n();
  const categoryIcon = renderStoredIcon(categoryOption?.icon, styles.categoryIcon);
  const categoryColor = categoryOption?.color ?? undefined;

  return (
    <Card key={template.id} className={styles.templateCard}>
      <button
        className={styles.templateButton}
        onClick={() => onSelect(template.id)}
        style={categoryColor ? { borderInlineStartColor: categoryColor } : undefined}
        type="button"
      >
        <div className={styles.templateHeader}>
          <div className={styles.templateMain}>
            <div className={styles.templateTitleRow}>
              {categoryIcon ? (
                <span aria-hidden="true" className={styles.categoryLead} style={categoryColor ? { color: categoryColor } : undefined}>
                  {categoryIcon}
                </span>
              ) : categoryColor ? (
                <span aria-hidden="true" className={styles.categoryLead} style={{ color: categoryColor }}>
                  <span className={styles.categoryDot} />
                </span>
              ) : null}
              <div className={styles.templateLine}>
                <strong className={styles.templateName}>{template.name}</strong>
                <span className={styles.templateMetaSeparator}>·</span>
                <p className={styles.templateMeta}>
                  {template.categoryName} · {template.accountName} ·{" "}
                  {template.type === "INCOME"
                    ? t("fixedTransactions.receivesOnDay", {
                        day: String(template.dueDay).padStart(2, "0"),
                      })
                    : t("fixedTransactions.dueOnDay", {
                        day: String(template.dueDay).padStart(2, "0"),
                      })}
                  {template.currency === "USD" && template.exchangeRate != null
                    ? ` · ${t("exchangeRate.reference", {
                        amount: formatCurrency(template.type === "EXPENSE" ? -Math.abs(template.amount) : Math.abs(template.amount), "USD"),
                        rate: formatCurrency(template.exchangeRate),
                      })}`
                    : null}
                </p>
              </div>
            </div>
          </div>
          <strong className={styles.templateAmount}>
            <MoneyAmount amount={template.convertedAmount ?? template.amount} type={template.type} />
          </strong>
        </div>

        <div className={styles.templateBadges}>
          <Badge tone={template.type === "INCOME" ? "success" : "default"}>{t(`transactionTypes.${template.type}`)}</Badge>
          <Badge tone={template.archivedFromMonth ? "muted" : "success"}>
            {template.archivedFromMonth
              ? t("common.archivedFrom", {
                  month: formatReferenceMonth(template.archivedFromMonth),
                })
              : t("common.active")}
          </Badge>
        </div>
      </button>
    </Card>
  );
}
