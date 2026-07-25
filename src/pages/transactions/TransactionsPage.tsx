import { useCallback, useMemo, useState } from "react";
import type { Transaction, TransactionFilters } from "../../app/api/transactions";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import { useI18n } from "../../app/i18n/I18nContext";
import { getCurrentReferenceMonth } from "../../lib/formatters/date";
import { useAccountOptions } from "../../lib/options/useAccountOptions";
import { useCategoryOptions } from "../../lib/options/useCategoryOptions";
import { useFamilyMemberOptions } from "../../lib/options/useFamilyMemberOptions";
import { useMobileSearchToggle } from "../../lib/useMobileSearchToggle";
import TransactionFiltersPanel from "./TransactionFiltersPanel";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";
import styles from "./TransactionsPage.module.scss";

type DrawerState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; id: string; transaction: Transaction };

export default function TransactionsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const initialReferenceMonth = useMemo(() => getCurrentReferenceMonth(), []);
  const [filters, setFilters] = useState<TransactionFilters>({
    referenceMonth: initialReferenceMonth,
  });
  const [drawerState, setDrawerState] = useState<DrawerState>({ mode: "closed" });
  const [refreshKey, setRefreshKey] = useState(0);
  const mobileSearch = useMobileSearchToggle();

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
            value={filters}
            onChange={setFilters}
            onCloseMobileSearch={mobileSearch.close}
            isMobileSearchOpen={mobileSearch.isOpen}
            mobileSearchInputRef={mobileSearch.inputRef}
          />
        </Card>

        <TransactionList
          categoryOptions={categoryOptions}
          filters={filters}
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
