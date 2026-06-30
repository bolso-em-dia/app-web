import { useCallback, useEffect, useState } from "react";
import { getDashboard, type DashboardResponse } from "../app/api/dashboard";
import { useI18n } from "../app/i18n/I18nContext";
import Card from "../components/ui/Card";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../app/auth/useAuth";
import Spinner from "../components/feedback/Spinner";
import Button from "../components/ui/Button";
import { formatCurrency } from "../lib/formatters/currency";
import {
  formatDay,
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../lib/formatters/date";
import styles from "./HomePage.module.scss";

export default function HomePage() {
  const { accessToken, user } = useAuth();
  const { t } = useI18n();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getDashboard(
        getCurrentReferenceMonth(),
        accessToken,
      );
      setDashboard(response);
    } catch {
      setError(t("home.error"));
      setDashboard(null);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <AppShell title={t("home.title")} subtitle={t("home.subtitle")}>
      <section className={styles.summaryGrid}>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>
            {t("home.referenceMonth")}
          </span>
          <strong className={styles.summaryValue}>
            {dashboard
              ? formatReferenceMonth(dashboard.referenceMonth)
              : formatReferenceMonth(getCurrentReferenceMonth())}
          </strong>
        </Card>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t("home.income")}</span>
          <strong className={styles.summaryValue}>
            {formatCurrency(dashboard?.summary.totalIncome ?? 0)}
          </strong>
        </Card>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t("home.expense")}</span>
          <strong className={styles.summaryValue}>
            {formatCurrency(dashboard?.summary.totalExpense ?? 0)}
          </strong>
        </Card>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t("home.balance")}</span>
          <strong className={styles.summaryValue}>
            {formatCurrency(dashboard?.summary.balance ?? 0)}
          </strong>
        </Card>
      </section>

      {isLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label={t("home.loading")} />
        </Card>
      ) : null}

      {error ? (
        <Card className={styles.feedbackCard}>
          <h2 className={styles.panelTitle}>{t("home.unavailable")}</h2>
          <p className={styles.body}>{error}</p>
          <Button onClick={() => void loadDashboard()} type="button">
            {t("common.retry")}
          </Button>
        </Card>
      ) : null}

      {dashboard && !isLoading && !error ? (
        <section className={styles.grid}>
          <Card className={styles.panel}>
            <h2 className={styles.panelTitle}>{t("home.session")}</h2>
            <dl className={styles.definitionList}>
              <div>
                <dt>{t("common.name")}</dt>
                <dd>{user?.name}</dd>
              </div>
              <div>
                <dt>{t("common.email")}</dt>
                <dd>{user?.email}</dd>
              </div>
              <div>
                <dt>{t("common.role")}</dt>
                <dd>
                  {user?.role
                    ? t(user.role === "ADMIN" ? "roles.ADMIN" : "roles.USER")
                    : null}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className={styles.panel}>
            <h2 className={styles.panelTitle}>{t("home.envelopes")}</h2>
            <ul className={styles.itemList}>
              {dashboard.envelopes.map((envelope) => (
                <li key={envelope.id} className={styles.itemRow}>
                  <div>
                    <strong>{envelope.name}</strong>
                    <p className={styles.itemMeta}>
                      {envelope.type === "ALLOWANCE" && envelope.ownerMemberName
                        ? t("home.allowanceFor", {
                            name: envelope.ownerMemberName,
                          })
                        : t("home.linkedCategories", {
                            count: envelope.categories.length,
                          })}
                    </p>
                  </div>
                  <div className={styles.itemAmountBlock}>
                    <strong>{formatCurrency(envelope.remainingAmount)}</strong>
                    <span className={styles.itemMeta}>
                      {t("home.usedAmount", {
                        amount: formatCurrency(envelope.consumedAmount),
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className={styles.panel}>
            <h2 className={styles.panelTitle}>
              {t("home.recentTransactions")}
            </h2>
            <ul className={styles.itemList}>
              {dashboard.recentTransactions.map((transaction) => (
                <li key={transaction.id} className={styles.itemRow}>
                  <div>
                    <strong>{transaction.description}</strong>
                    <p className={styles.itemMeta}>
                      {transaction.categoryName} · {transaction.accountName} ·{" "}
                      {formatDay(transaction.transactionDate)}
                    </p>
                  </div>
                  <strong>{formatCurrency(transaction.amount)}</strong>
                </li>
              ))}
            </ul>
          </Card>

          <Card className={styles.panel}>
            <h2 className={styles.panelTitle}>{t("home.categoryBreakdown")}</h2>
            <ul className={styles.itemList}>
              {dashboard.categoryBreakdown.map((category) => (
                <li key={category.categoryId} className={styles.itemRow}>
                  <strong>{category.categoryName}</strong>
                  <strong>{formatCurrency(category.amount)}</strong>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}
    </AppShell>
  );
}
