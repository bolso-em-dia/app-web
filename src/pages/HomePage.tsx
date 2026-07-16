import { useCallback, useEffect, useState } from "react";
import { getDashboard, type DashboardResponse } from "../app/api/dashboard";
import { materializeTransactions } from "../app/api/transactions";
import { useI18n } from "../app/i18n/I18nContext";
import Card from "../components/ui/Card";
import MoneyAmount from "../components/ui/MoneyAmount";
import MonthSelector from "../components/ui/MonthSelector";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../app/auth/useAuth";
import Spinner from "../components/feedback/Spinner";
import Button from "../components/ui/Button";
import Switch from "../components/ui/Switch";
import SimplePagination from "../components/ui/SimplePagination";
import { formatCurrency } from "../lib/formatters/currency";
import { formatDay, getCurrentReferenceMonth } from "../lib/formatters/date";
import styles from "./HomePage.module.scss";

const ITEMS_PER_PAGE = 10;

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
  const [referenceMonth, setReferenceMonth] = useState(getCurrentReferenceMonth);
  const [considerBudgetsInBalance, setConsiderBudgetsInBalance] = useState(user?.preferences.showBalanceWithBudgets ?? false);
  const [recentTxPage, setRecentTxPage] = useState(0);
  const [catPage, setCatPage] = useState(0);

  useEffect(() => {
    setConsiderBudgetsInBalance(user?.preferences.showBalanceWithBudgets ?? false);
  }, [user?.preferences.showBalanceWithBudgets]);

  useEffect(() => {
    setRecentTxPage(0);
    setCatPage(0);
  }, [referenceMonth]);

  const loadDashboard = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Materialize fixed expenses for this month before fetching dashboard
      await materializeTransactions(referenceMonth, accessToken);

      const response = await getDashboard(referenceMonth, accessToken);
      setDashboard(response);
    } catch {
      setError(t("home.error"));
      setDashboard(null);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, referenceMonth, t]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const displayedBalance = considerBudgetsInBalance ? (dashboard?.summary.availableBalance ?? 0) : (dashboard?.summary.balance ?? 0);

  const balanceLabel = considerBudgetsInBalance ? t("home.availableBalance") : t("home.balance");

  const balanceAmountClass =
    displayedBalance > 0 ? styles.amountPositive : displayedBalance < 0 ? styles.amountNegative : styles.amountNeutral;

  const displayExpense = considerBudgetsInBalance
    ? (dashboard?.summary.totalExpense ?? 0) + (dashboard?.summary.reservedBudgetAmount ?? 0)
    : (dashboard?.summary.totalExpense ?? 0);

  const expenseLabel = considerBudgetsInBalance ? t("home.expenseWithBudgets") : t("home.expense");

  const recentTxPages = Math.ceil((dashboard?.recentTransactions.length ?? 0) / ITEMS_PER_PAGE);
  const recentTxSlice = (dashboard?.recentTransactions ?? []).slice(recentTxPage * ITEMS_PER_PAGE, (recentTxPage + 1) * ITEMS_PER_PAGE);

  const totalExpense = dashboard?.summary.totalExpense ?? 0;
  const catPages = Math.ceil((dashboard?.categoryBreakdown.length ?? 0) / ITEMS_PER_PAGE);
  const catSlice = (dashboard?.categoryBreakdown ?? []).slice(catPage * ITEMS_PER_PAGE, (catPage + 1) * ITEMS_PER_PAGE);

  return (
    <AppShell title={t("home.title")}>
      <section className={styles.summaryHeader}>
        <Card className={styles.balanceModeCard}>
          <Switch
            checked={considerBudgetsInBalance}
            label={t("home.considerBudgetsInBalance")}
            onChange={(event) => setConsiderBudgetsInBalance(event.currentTarget.checked)}
          />
          <span className={styles.balanceModeMeta}>
            {t("home.reservedBudgetAmount")}: {formatCurrency(dashboard?.summary.reservedBudgetAmount ?? 0)}
          </span>
        </Card>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t("home.referenceMonth")}</span>
          <MonthSelector id="dashboard-month" onChange={setReferenceMonth} value={referenceMonth} />
        </Card>
      </section>

      <section className={styles.summaryGrid}>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t("home.income")}</span>
          <strong className={styles.summaryValue}>
            <MoneyAmount amount={dashboard?.summary.totalIncome ?? 0} type="INCOME" />
          </strong>
        </Card>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{expenseLabel}</span>
          <strong className={styles.summaryValue}>
            <MoneyAmount amount={displayExpense} type="EXPENSE" />
          </strong>
        </Card>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{balanceLabel}</span>
          <strong className={`${styles.summaryValue} ${balanceAmountClass}`}>{formatCurrency(displayedBalance)}</strong>
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
            <h2 className={styles.panelTitle}>{t("home.budgets")}</h2>
            <ul className={styles.itemList}>
              {dashboard.budgets.map((budget) => {
                const consumptionPercent = getBudgetConsumptionPercent(budget.consumedAmount, budget.monthlyLimit);
                const rawRatio = budget.monthlyLimit > 0 ? (budget.consumedAmount / budget.monthlyLimit) * 100 : 0;

                let fillClass = styles.progressFill;
                if (rawRatio > 100) {
                  fillClass = `${styles.progressFill} ${styles.progressFillDanger}`;
                } else if (rawRatio >= 80) {
                  fillClass = `${styles.progressFill} ${styles.progressFillWarning}`;
                } else {
                  fillClass = `${styles.progressFill} ${styles.progressFillSafe}`;
                }

                return (
                  <li key={budget.id} className={`${styles.itemRow} ${styles.budgetRow}`}>
                    <div className={styles.budgetHeader}>
                      <strong>{budget.name}</strong>
                    </div>
                    <div className={styles.itemAmountBlock}>
                      <strong>
                        {formatCurrency(budget.consumedAmount)} / {formatCurrency(budget.monthlyLimit)}
                      </strong>
                    </div>
                    <div aria-hidden="true" className={`${styles.progressTrack} ${styles.budgetProgress}`}>
                      <span className={fillClass} style={{ width: `${consumptionPercent}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className={styles.panel}>
            <h2 className={styles.panelTitle}>{t("home.categoryBreakdown")}</h2>
            <ul className={styles.itemList}>
              {catSlice.map((category) => {
                const percent = totalExpense > 0 ? ((category.amount / totalExpense) * 100).toFixed(1) : "0.0";

                return (
                  <li key={category.categoryId} className={styles.itemRow}>
                    <div className={styles.itemContent}>
                      <div className={styles.categoryRow}>
                        <strong>{category.categoryName}</strong>
                        <span className={styles.categoryMetrics}>
                          <MoneyAmount amount={category.amount} type="EXPENSE" />
                          <span className={styles.categoryPercent}>{percent}%</span>
                        </span>
                      </div>
                      <div aria-hidden="true" className={styles.progressTrack}>
                        <span className={styles.progressFill} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <SimplePagination page={catPage} totalPages={catPages} onPageChange={setCatPage} />
          </Card>

          <Card className={styles.panel}>
            <h2 className={styles.panelTitle}>{t("home.recentTransactions")}</h2>
            <ul className={styles.itemList}>
              {recentTxSlice.map((transaction) => (
                <li key={transaction.id} className={styles.itemRow}>
                  <div>
                    <strong>
                      {transaction.description}
                      {transaction.projected ? <span className={styles.projectedBadge}> {t("transactions.projected")}</span> : null}
                    </strong>
                    <p className={styles.itemMeta}>
                      {transaction.categoryName} · {transaction.accountName} · {formatDay(transaction.transactionDate)}
                      {transaction.currency === "USD" && transaction.exchangeRate != null
                        ? ` · ${formatCurrency(
                            transaction.type === "EXPENSE" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
                            "USD",
                          )} (cot. ${formatCurrency(transaction.exchangeRate)})`
                        : null}
                    </p>
                  </div>
                  <MoneyAmount amount={transaction.convertedAmount} type={transaction.type as "INCOME" | "EXPENSE"} />
                </li>
              ))}
            </ul>
            <SimplePagination page={recentTxPage} totalPages={recentTxPages} onPageChange={setRecentTxPage} />
          </Card>
        </section>
      ) : null}
    </AppShell>
  );
}
