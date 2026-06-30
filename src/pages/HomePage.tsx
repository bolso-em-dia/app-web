import { useCallback, useEffect, useState } from "react";
import { getDashboard, type DashboardResponse } from "../app/api/dashboard";
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
      setError("Unable to load the dashboard right now.");
      setDashboard(null);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <AppShell
      title="Dashboard"
      subtitle="Authenticated workspace shell for the phase 1 finance modules."
    >
      <section className={styles.summaryGrid}>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Reference month</span>
          <strong className={styles.summaryValue}>
            {dashboard
              ? formatReferenceMonth(dashboard.referenceMonth)
              : formatReferenceMonth(getCurrentReferenceMonth())}
          </strong>
        </Card>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Income</span>
          <strong className={styles.summaryValue}>
            {formatCurrency(dashboard?.summary.totalIncome ?? 0)}
          </strong>
        </Card>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Expense</span>
          <strong className={styles.summaryValue}>
            {formatCurrency(dashboard?.summary.totalExpense ?? 0)}
          </strong>
        </Card>
        <Card className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Balance</span>
          <strong className={styles.summaryValue}>
            {formatCurrency(dashboard?.summary.balance ?? 0)}
          </strong>
        </Card>
      </section>

      {isLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label="Loading dashboard" />
        </Card>
      ) : null}

      {error ? (
        <Card className={styles.feedbackCard}>
          <h2 className={styles.panelTitle}>Dashboard unavailable</h2>
          <p className={styles.body}>{error}</p>
          <Button onClick={() => void loadDashboard()} type="button">
            Retry
          </Button>
        </Card>
      ) : null}

      {dashboard && !isLoading && !error ? (
        <section className={styles.grid}>
          <Card className={styles.panel}>
            <h2 className={styles.panelTitle}>Session</h2>
            <dl className={styles.definitionList}>
              <div>
                <dt>Name</dt>
                <dd>{user?.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{user?.email}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{user?.role}</dd>
              </div>
            </dl>
          </Card>

          <Card className={styles.panel}>
            <h2 className={styles.panelTitle}>Envelopes</h2>
            <ul className={styles.itemList}>
              {dashboard.envelopes.map((envelope) => (
                <li key={envelope.id} className={styles.itemRow}>
                  <div>
                    <strong>{envelope.name}</strong>
                    <p className={styles.itemMeta}>
                      {envelope.type === "ALLOWANCE" && envelope.ownerMemberName
                        ? `Allowance for ${envelope.ownerMemberName}`
                        : `${envelope.categories.length} linked categories`}
                    </p>
                  </div>
                  <div className={styles.itemAmountBlock}>
                    <strong>{formatCurrency(envelope.remainingAmount)}</strong>
                    <span className={styles.itemMeta}>
                      {formatCurrency(envelope.consumedAmount)} used
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className={styles.panel}>
            <h2 className={styles.panelTitle}>Recent transactions</h2>
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
            <h2 className={styles.panelTitle}>Category breakdown</h2>
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
