import { useCallback, useEffect, useState } from "react";
import { getDashboard, type DashboardResponse } from "../app/api/dashboard";
import { useI18n } from "../app/i18n/I18nContext";
import Card from "../components/ui/Card";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../app/auth/useAuth";
import Spinner from "../components/feedback/Spinner";
import Button from "../components/ui/Button";
import Switch from "../components/ui/Switch";
import { formatCurrency } from "../lib/formatters/currency";
import {
  formatDay,
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../lib/formatters/date";
import styles from "./HomePage.module.scss";

function getBudgetConsumptionPercent(consumedAmount: number, monthlyLimit: number) {
  if (monthlyLimit <= 0) {
    return 0;
  }

  return Math.min(Math.max((consumedAmount / monthlyLimit) * 100, 0), 100);
}

export default function HomePage() {
  const { accessToken, user } = useAuth();
  const { t } = useI18n();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [considerBudgetsInBalance, setConsiderBudgetsInBalance] = useState(
    user?.preferences.showBalanceWithBudgets ?? false,
  );

  useEffect(() => {
    setConsiderBudgetsInBalance(user?.preferences.showBalanceWithBudgets ?? false);
  }, [user?.preferences.showBalanceWithBudgets]);

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

  const displayedBalance = considerBudgetsInBalance
    ? (dashboard?.summary.availableBalance ?? 0)
    : (dashboard?.summary.balance ?? 0);

  const balanceLabel = considerBudgetsInBalance
    ? t("home.availableBalance")
    : t("home.balance");

  return (
    <AppShell title={t("home.title")} subtitle={t("home.subtitle")}>
      <section className={styles.summaryHeader}>
        <Card className={styles.balanceModeCard}>
          <Switch
            checked={considerBudgetsInBalance}
            label={t("home.considerBudgetsInBalance")}
            onChange={(event) =>
              setConsiderBudgetsInBalance(event.currentTarget.checked)
            }
          />
          <span className={styles.balanceModeMeta}>
            {t("home.reservedBudgetAmount")}: {formatCurrency(dashboard?.summary.reservedBudgetAmount ?? 0)}
          </span>
        </Card>
      </section>

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
          <span className={styles.summaryLabel}>{balanceLabel}</span>
          <strong className={styles.summaryValue}>
            {formatCurrency(displayedBalance)}
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
            <h2 className={styles.panelTitle}>{t("home.budgets")}</h2>
            <ul className={styles.itemList}>
              {dashboard.budgets.map((budget) => {
                const consumptionPercent = getBudgetConsumptionPercent(
                  budget.consumedAmount,
                  budget.monthlyLimit,
                );

                return (
                  <li key={budget.id} className={styles.itemRow}>
                    <div className={styles.itemContent}>
                      <div>
                        <strong>{budget.name}</strong>
                        <p className={styles.itemMeta}>
                          {budget.type === "ALLOWANCE" && budget.ownerMemberName
                            ? t("home.allowanceFor", {
                                name: budget.ownerMemberName,
                              })
                            : t("home.linkedCategories", {
                                count: budget.categories.length,
                              })}
                        </p>
                      </div>
                      <div
                        aria-hidden="true"
                        className={styles.progressTrack}
                      >
                        <span
                          className={styles.progressFill}
                          style={{ width: `${consumptionPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className={styles.itemAmountBlock}>
                      <strong>{formatCurrency(budget.monthlyLimit)}</strong>
                      <span className={styles.itemMeta}>
                        {t("home.consumedOfLimit", {
                          consumed: formatCurrency(budget.consumedAmount),
                          limit: formatCurrency(budget.monthlyLimit),
                        })}
                      </span>
                    </div>
                  </li>
                );
              })}
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
