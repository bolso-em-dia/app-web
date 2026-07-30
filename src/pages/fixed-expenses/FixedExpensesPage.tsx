import { useMemo, useState } from "react";
import type { AccountOption } from "../../app/api/accounts";
import type { CategoryOption } from "../../app/api/categories";
import type { FixedExpenseTemplate } from "../../app/api/fixedExpenses";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import FilterToolbar from "../../components/ui/FilterToolbar";
import FilterSelectInput from "../../components/ui/filterFields/FilterSelectInput";
import FilterTextInput from "../../components/ui/filterFields/FilterTextInput";
import { getCurrentReferenceMonth } from "../../lib/formatters/date";
import { useI18n } from "../../app/i18n/I18nContext";
import { ACTIVE_STATUS_FILTER, type StatusFilter } from "../../lib/constants";
import type { FilterFields } from "../../lib/filterFields";
import { useMobileSearchToggle } from "../../lib/useMobileSearchToggle";
import { useFiltersState } from "../../lib/useFiltersState";
import FixedExpenseList from "./FixedExpenseList";
import FixedExpenseForm from "./FixedExpenseForm";
import styles from "./FixedExpensesPage.module.scss";

type FixedExpenseFilters = { search: string; status: StatusFilter };
type DrawerState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; id: string; template: FixedExpenseTemplate };

const DEFAULT_FILTERS: FixedExpenseFilters = {
  search: "",
  status: ACTIVE_STATUS_FILTER,
};

export default function FixedExpensesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const referenceMonth = getCurrentReferenceMonth();
  const { filters, patchFilters, clearFilter } = useFiltersState(DEFAULT_FILTERS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [drawerState, setDrawerState] = useState<DrawerState>({ mode: "closed" });
  const mobileSearch = useMobileSearchToggle();

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

  const fields = useMemo<FilterFields>(
    () => ({
      search: {
        kind: "text",
        label: t("common.search"),
        value: filters.search,
        defaultValue: "",
        placement: "visible",
        element: (
          <FilterTextInput
            id="fixed-expense-search"
            inputRef={mobileSearch.inputRef}
            label={t("common.search")}
            onBlur={mobileSearch.handleBlur}
            onChange={(search) => {
              patchFilters({ search });
            }}
            onFocus={mobileSearch.handleFocus}
            placeholder={t("fixedTransactions.searchPlaceholder")}
            value={filters.search}
          />
        ),
      },
      status: {
        kind: "select",
        label: t("common.status"),
        value: filters.status,
        defaultValue: ACTIVE_STATUS_FILTER,
        placement: "visible",
        options: [
          { value: "ALL", label: t("common.all") },
          { value: "ACTIVE", label: t("common.active") },
          { value: "ARCHIVED", label: t("common.archived") },
        ],
        element: (
          <FilterSelectInput<StatusFilter>
            id="fixed-expense-status-filter"
            label={t("common.status")}
            onChange={(status) => {
              patchFilters({ status: status as StatusFilter });
            }}
            options={[
              { value: "ALL", label: t("common.all") },
              { value: "ACTIVE", label: t("common.active") },
              { value: "ARCHIVED", label: t("common.archived") },
            ]}
            placeholder={t("common.all")}
            value={filters.status}
          />
        ),
      },
    }),
    [filters.search, filters.status, mobileSearch.handleBlur, mobileSearch.handleFocus, mobileSearch.inputRef, patchFilters, t],
  );

  const isCreating = drawerState.mode === "create";
  const isDrawerOpen = drawerState.mode !== "closed";
  const selectedId = drawerState.mode === "edit" ? drawerState.id : null;
  const selectedTemplate = drawerState.mode === "edit" ? drawerState.template : null;
  const toolbar = (
    <FilterToolbar
      fields={fields}
      onDismissMobileSearchFocus={mobileSearch.blurInput}
      onCloseMobileSearch={mobileSearch.close}
      isMobileSearchFocused={mobileSearch.isFocused}
      isMobileSearchOpen={mobileSearch.isOpen}
      isPanelOpen={isFiltersOpen}
      onClosePanel={() => setIsFiltersOpen(false)}
      onResetField={(name, defaultValue) => {
        clearFilter(name as keyof FixedExpenseFilters, defaultValue as FixedExpenseFilters[keyof FixedExpenseFilters]);
      }}
      onTogglePanel={() => setIsFiltersOpen((current) => !current)}
    />
  );

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
        <Card className={styles.toolbarPanel}>{toolbar}</Card>

        <FixedExpenseList
          filters={filters}
          referenceMonth={referenceMonth}
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
