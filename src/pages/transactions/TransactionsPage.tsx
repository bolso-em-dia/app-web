import { useCallback, useMemo, useState } from "react";
import type { Transaction, TransactionFilters, TransactionSortBy } from "../../app/api/transactions";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import SortAction from "../../components/ui/SortAction";
import { useI18n } from "../../app/i18n/I18nContext";
import { getCurrentReferenceMonth } from "../../lib/formatters/date";
import { useAccountOptions } from "../../lib/options/useAccountOptions";
import { useCategoryOptions } from "../../lib/options/useCategoryOptions";
import { useFamilyMemberOptions } from "../../lib/options/useFamilyMemberOptions";
import { useMobileSearchToggle } from "../../lib/useMobileSearchToggle";
import { useSortSearchParams } from "../../lib/useSortSearchParams";
import type { SortOption } from "../../lib/sorting";
import TransactionFiltersPanel from "./TransactionFiltersPanel";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";
import styles from "./TransactionsPage.module.scss";

type DrawerState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; id: string; transaction: Transaction };

export default function TransactionsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const initialReferenceMonth = useMemo(() => getCurrentReferenceMonth(), []);
  const transactionSortByValues = useMemo(() => ["transactionDate", "amount", "description"] as const, []);
  const [filters, setFilters] = useState<TransactionFilters>({
    referenceMonth: initialReferenceMonth,
  });
  const { value: sort, setValue: setSort } = useSortSearchParams<TransactionSortBy>({
    defaultValue: { sortBy: "transactionDate", sortDir: "desc" },
    validSortBy: transactionSortByValues,
  });
  const [drawerState, setDrawerState] = useState<DrawerState>({ mode: "closed" });
  const [refreshKey, setRefreshKey] = useState(0);
  const mobileSearch = useMobileSearchToggle();

  const sortOptions = useMemo<SortOption<TransactionSortBy>[]>(
    () => [
      { sortBy: "transactionDate", sortDir: "desc", label: t("transactions.sort.transactionDateDesc") },
      { sortBy: "transactionDate", sortDir: "asc", label: t("transactions.sort.transactionDateAsc") },
      { sortBy: "amount", sortDir: "desc", label: t("transactions.sort.amountDesc") },
      { sortBy: "amount", sortDir: "asc", label: t("transactions.sort.amountAsc") },
      { sortBy: "description", sortDir: "asc", label: t("transactions.sort.descriptionAsc") },
      { sortBy: "description", sortDir: "desc", label: t("transactions.sort.descriptionDesc") },
    ],
    [t],
  );

  const { items: accounts, isLoading: isAccountsLoading } = useAccountOptions();
  const { items: categoryOptions, isLoading: isCategoriesLoading } = useCategoryOptions(filters.referenceMonth);
  const { items: members, isLoading: isMembersLoading } = useFamilyMemberOptions({
    allowanceOnly: true,
    referenceMonth: filters.referenceMonth,
  });

  const handleSelect = useCallback((id: string, transaction: Transaction) => {
    setDrawerState({ mode: "edit", id, transaction });
  }, []);

  const handleStartCreate = useCallback(() => {
    setDrawerState({ mode: "create" });
  }, []);

  const handleFormSuccess = useCallback((intent?: "save-and-create-new") => {
    if (intent === "save-and-create-new") {
      return;
    }
    setDrawerState({ mode: "closed" });
    setRefreshKey((k) => k + 1);
  }, []);

  const handleCancelForm = useCallback(() => {
    setDrawerState({ mode: "closed" });
  }, []);

  const isCreating = drawerState.mode === "create";
  const isDrawerOpen = drawerState.mode !== "closed";
  const selectedTransactionId = drawerState.mode === "edit" ? drawerState.id : null;
  const selectedTransaction = drawerState.mode === "edit" ? drawerState.transaction : null;
  const isReferenceDataLoading = isAccountsLoading || isCategoriesLoading || isMembersLoading;

  return (
    <AppShell
      mobileActionBarHidden={isDrawerOpen}
      mobileSearchDockVisible={mobileSearch.isOpen}
      mobileActions={{
        createLabel: t("transactions.new"),
        onCreate: handleStartCreate,
        onSearch: mobileSearch.open,
        searchExpanded: mobileSearch.isOpen,
      }}
      title={t("transactions.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("transactions.new")}
        </Button>
      }
    >
      <section className={styles.stack}>
        <Card className={styles.toolbarPanel}>
          <TransactionFiltersPanel
            actions={<SortAction onChange={setSort} options={sortOptions} value={sort} />}
            value={filters}
            onChange={setFilters}
            onDismissMobileSearchFocus={mobileSearch.blurInput}
            onCloseMobileSearch={mobileSearch.close}
            onMobileSearchBlur={mobileSearch.handleBlur}
            onMobileSearchFocus={mobileSearch.handleFocus}
            isMobileSearchFocused={mobileSearch.isFocused}
            isMobileSearchOpen={mobileSearch.isOpen}
            mobileSearchInputRef={mobileSearch.inputRef}
          />
        </Card>

        <TransactionList
          categoryOptions={categoryOptions}
          filters={filters}
          sort={sort}
          selectedId={selectedTransactionId}
          onSelect={handleSelect}
          refreshKey={refreshKey}
        />

        {isDrawerOpen ? (
          <Drawer onClose={handleCancelForm} title={isCreating ? t("transactions.newTitle") : t("transactions.detailsTitle")}>
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
