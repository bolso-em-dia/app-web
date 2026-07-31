import { useMemo, useState } from "react";
import type { AccountOption } from "../../app/api/accounts";
import type { CategoryOption } from "../../app/api/categories";
import type { FixedExpenseFilters, FixedExpenseSortBy, FixedExpenseTemplate } from "../../app/api/fixedExpenses";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import SortAction from "../../components/ui/SortAction";
import { getCurrentReferenceMonth } from "../../lib/formatters/date";
import { useI18n } from "../../app/i18n/I18nContext";
import { ACTIVE_STATUS_FILTER } from "../../lib/constants";
import { useMobileSearchToggle } from "../../lib/useMobileSearchToggle";
import { useFiltersState } from "../../lib/useFiltersState";
import { useSortSearchParams } from "../../lib/useSortSearchParams";
import type { SortOption } from "../../lib/sorting";
import FixedExpenseFiltersPanel from "./FixedExpenseFiltersPanel";
import FixedExpenseList from "./FixedExpenseList";
import FixedExpenseForm from "./FixedExpenseForm";
import styles from "./FixedExpensesPage.module.scss";

type DrawerState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; id: string; template: FixedExpenseTemplate };

const DEFAULT_FILTERS: FixedExpenseFilters = {
  search: undefined,
  status: ACTIVE_STATUS_FILTER,
  type: undefined,
  accountId: undefined,
  categoryIds: undefined,
};

export default function FixedExpensesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const referenceMonth = getCurrentReferenceMonth();
  const { filters, setFilters } = useFiltersState(DEFAULT_FILTERS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [drawerState, setDrawerState] = useState<DrawerState>({ mode: "closed" });
  const mobileSearch = useMobileSearchToggle();
  const fixedExpenseSortByValues = useMemo(() => ["name", "amount", "dueDay"] as const, []);
  const { value: sort, setValue: setSort } = useSortSearchParams<FixedExpenseSortBy>({
    defaultValue: { sortBy: "name", sortDir: "asc" },
    validSortBy: fixedExpenseSortByValues,
  });

  const sortOptions = useMemo<SortOption<FixedExpenseSortBy>[]>(
    () => [
      { sortBy: "name", sortDir: "asc", label: t("fixedTransactions.sort.nameAsc") },
      { sortBy: "name", sortDir: "desc", label: t("fixedTransactions.sort.nameDesc") },
      { sortBy: "amount", sortDir: "desc", label: t("fixedTransactions.sort.amountDesc") },
      { sortBy: "amount", sortDir: "asc", label: t("fixedTransactions.sort.amountAsc") },
      { sortBy: "dueDay", sortDir: "asc", label: t("fixedTransactions.sort.dueDayAsc") },
      { sortBy: "dueDay", sortDir: "desc", label: t("fixedTransactions.sort.dueDayDesc") },
    ],
    [t],
  );

  function handleSelect(_id: string, template: FixedExpenseTemplate) {
    setDrawerState({ mode: "edit", id: template.id, template });
  }

  function handleStartCreate() {
    setDrawerState({ mode: "create" });
  }

  function handleCloseDrawer() {
    setDrawerState({ mode: "closed" });
  }

  function handleSuccess() {
    handleCloseDrawer();
    setRefreshKey((k) => k + 1);
  }

  const isCreating = drawerState.mode === "create";
  const isDrawerOpen = drawerState.mode !== "closed";
  const selectedId = drawerState.mode === "edit" ? drawerState.id : null;
  const selectedTemplate = drawerState.mode === "edit" ? drawerState.template : null;
  return (
    <AppShell
      mobileActionBarHidden={isDrawerOpen}
      mobileSearchDockVisible={mobileSearch.isOpen}
      mobileActions={{
        createLabel: t("fixedTransactions.new"),
        onCreate: handleStartCreate,
        onSearch: mobileSearch.open,
        searchExpanded: mobileSearch.isOpen,
      }}
      title={t("fixedTransactions.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("fixedTransactions.new")}
        </Button>
      }
    >
      <section className={styles.stack}>
        <Card className={styles.toolbarPanel}>
          <FixedExpenseFiltersPanel
            actions={<SortAction onChange={setSort} options={sortOptions} value={sort} />}
            referenceMonth={referenceMonth}
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

        <FixedExpenseList
          filters={filters}
          referenceMonth={referenceMonth}
          sort={sort}
          selectedId={selectedId}
          onSelect={handleSelect}
          refreshKey={refreshKey}
          onAccountOptionsLoaded={setAccountOptions}
          onCategoryOptionsLoaded={setCategoryOptions}
        />

        {isDrawerOpen ? (
          <Drawer onClose={handleCloseDrawer} title={isCreating ? t("fixedTransactions.newTitle") : t("fixedTransactions.detailsTitle")}>
            <FixedExpenseForm
              template={selectedTemplate}
              user={user!}
              accountOptions={accountOptions}
              categoryOptions={categoryOptions}
              onSuccess={handleSuccess}
              onCancel={handleCloseDrawer}
            />
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
