import { useCallback, useMemo, useState } from "react";
import type { Account } from "../../app/api/accounts";
import type { CategoryOption } from "../../app/api/categories";
import type { FamilyMember } from "../../app/api/family";
import type {
  Transaction,
  TransactionFilters,
} from "../../app/api/transactions";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import FilterToolbar from "../../components/ui/FilterToolbar";
import { useI18n } from "../../app/i18n/I18nContext";
import {
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import { buildTransactionActiveFilters } from "./transactionActiveFilters";
import { useFiltersState } from "../../lib/useFiltersState";
import {
  TransactionFiltersPrimary,
  TransactionFiltersSecondary,
} from "./TransactionFiltersContent";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";
import styles from "./TransactionsPage.module.scss";

export default function TransactionsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const initialReferenceMonth = useMemo(() => getCurrentReferenceMonth(), []);

  const { filters, patchFilters, clearFilter, setFilters } =
    useFiltersState<TransactionFilters>({
      referenceMonth: initialReferenceMonth,
    });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const allowanceMembers = useMemo(
    () => members.filter((m) => m.active && m.allowanceEnabled),
    [members],
  );

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

  const handleReferenceDataLoaded = useCallback(
    (data: {
      accounts: Account[];
      categories: CategoryOption[];
      members: FamilyMember[];
    }) => {
      setAccounts(data.accounts);
      setCategoryOptions(data.categories);
      setMembers(data.members);
    },
    [],
  );

  const activeFilters = useMemo(
    () =>
      buildTransactionActiveFilters({
        accounts,
        allowanceMembers,
        categoryOptions,
        filters,
        t,
        removeFilter: (key) =>
          clearFilter(
            key as keyof TransactionFilters,
            undefined as TransactionFilters[keyof TransactionFilters],
          ),
      }),
    [accounts, allowanceMembers, categoryOptions, filters, t, clearFilter],
  );

  const isCreating = selectedTransactionId === null;

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
          <FilterToolbar
            activeFilters={activeFilters}
            isPanelOpen={isFiltersOpen}
            onClearFilters={() =>
              setFilters((current) => ({
                referenceMonth: current.referenceMonth,
              }))
            }
            onClosePanel={() => setIsFiltersOpen(false)}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
            primaryContent={
              <TransactionFiltersPrimary
                filters={filters}
                onFiltersChange={patchFilters}
                accounts={accounts}
                categoryOptions={categoryOptions}
                allowanceMembers={allowanceMembers}
              />
            }
            secondaryContent={
              <TransactionFiltersSecondary
                filters={filters}
                onFiltersChange={patchFilters}
                accounts={accounts}
                categoryOptions={categoryOptions}
                allowanceMembers={allowanceMembers}
              />
            }
          />
        </Card>

        <TransactionList
          filters={filters}
          selectedId={selectedTransactionId}
          onSelect={handleSelect}
          refreshKey={refreshKey}
          onReferenceDataLoaded={handleReferenceDataLoaded}
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
            </div>
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
