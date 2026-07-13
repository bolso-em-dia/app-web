import { useCallback, useMemo, useState } from "react";
import type {
  Transaction,
  TransactionFilters,
} from "../../app/api/transactions";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import { useI18n } from "../../app/i18n/I18nContext";
import {
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import { useAccountOptions } from "../../lib/options/useAccountOptions";
import { useCategoryOptions } from "../../lib/options/useCategoryOptions";
import { useFamilyMemberOptions } from "../../lib/options/useFamilyMemberOptions";
import TransactionFiltersPanel from "./TransactionFiltersPanel";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";
import styles from "./TransactionsPage.module.scss";

export default function TransactionsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const initialReferenceMonth = useMemo(() => getCurrentReferenceMonth(), []);
  const [filters, setFilters] = useState<TransactionFilters>({
    referenceMonth: initialReferenceMonth,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { items: accounts, isLoading: isAccountsLoading } = useAccountOptions();
  const { items: categoryOptions, isLoading: isCategoriesLoading } =
    useCategoryOptions(filters.referenceMonth);
  const { items: members, isLoading: isMembersLoading } =
    useFamilyMemberOptions();

  const handleSelect = useCallback((id: string, transaction: Transaction) => {
    setSelectedTransactionId(id);
    setSelectedTransaction(transaction);
    setDrawerOpen(true);
  }, []);

  const handleStartCreate = useCallback(() => {
    setSelectedTransactionId(null);
    setSelectedTransaction(null);
    setDrawerOpen(true);
  }, []);

  const handleFormSuccess = useCallback((intent?: "save-and-create-new") => {
    if (intent === "save-and-create-new") {
      return;
    }
    setSelectedTransactionId(null);
    setSelectedTransaction(null);
    setDrawerOpen(false);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleCancelForm = useCallback(() => {
    setSelectedTransactionId(null);
    setSelectedTransaction(null);
    setDrawerOpen(false);
  }, []);

  const isCreating = selectedTransactionId === null;
  const isReferenceDataLoading =
    isAccountsLoading || isCategoriesLoading || isMembersLoading;

  return (
    <AppShell
      title={t("transactions.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("transactions.new")}
        </Button>
      }
    >
      <section className={styles.stack}>
        <Card className={styles.toolbarPanel}>
          <TransactionFiltersPanel value={filters} onChange={setFilters} />
        </Card>

        <TransactionList
          categoryOptions={categoryOptions}
          filters={filters}
          selectedId={selectedTransactionId}
          onSelect={handleSelect}
          refreshKey={refreshKey}
        />

        {drawerOpen ? (
          <Drawer
            description={
              isCreating
                ? t("transactions.newDescription")
                : t("transactions.editDescription", {
                    month: formatReferenceMonth(filters.referenceMonth),
                  })
            }
            onClose={handleCancelForm}
            title={
              isCreating
                ? t("transactions.newTitle")
                : t("transactions.detailsTitle")
            }
          >
            <div className={styles.drawerStack}>
              {isReferenceDataLoading ? (
                <Spinner label={t("transactions.loading")} />
              ) : (
                <TransactionForm
                  key={selectedTransactionId ?? "create"}
                  transaction={selectedTransaction}
                  user={user!}
                  accounts={accounts}
                  categories={categoryOptions}
                  members={members}
                  referenceMonth={filters.referenceMonth}
                  onSuccess={handleFormSuccess}
                  onCancel={handleCancelForm}
                />
              )}
            </div>
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
