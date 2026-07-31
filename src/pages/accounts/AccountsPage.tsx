import { useCallback, useMemo, useState } from "react";
import type { Account, AccountType } from "../../app/api/accounts";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import FilterToolbar from "../../components/ui/FilterToolbar";
import SortAction from "../../components/ui/SortAction";
import FilterSelectInput from "../../components/ui/filterFields/FilterSelectInput";
import FilterTextInput from "../../components/ui/filterFields/FilterTextInput";
import { useI18n } from "../../app/i18n/I18nContext";
import { ACTIVE_STATUS_FILTER, type StatusFilter } from "../../lib/constants";
import type { FilterFields } from "../../lib/filterFields";
import { useMobileSearchToggle } from "../../lib/useMobileSearchToggle";
import { useFiltersState } from "../../lib/useFiltersState";
import { useSortSearchParams } from "../../lib/useSortSearchParams";
import type { SortOption } from "../../lib/sorting";
import AccountList from "./AccountList";
import AccountForm from "./AccountForm";
import styles from "./AccountsPage.module.scss";

type AccountFilters = {
  search: string;
  status: StatusFilter;
  type: "" | AccountType;
};

type DrawerState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; id: string; account: Account };

const DEFAULT_FILTERS: AccountFilters = {
  search: "",
  status: ACTIVE_STATUS_FILTER,
  type: "",
};

export default function AccountsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { filters, patchFilters, clearFilter } = useFiltersState(DEFAULT_FILTERS);
  const accountSortByValues = useMemo(() => ["name", "type"] as const, []);
  const { value: sort, setValue: setSort } = useSortSearchParams<"name" | "type">({
    defaultValue: { sortBy: "name", sortDir: "asc" },
    validSortBy: accountSortByValues,
  });

  const [drawerState, setDrawerState] = useState<DrawerState>({ mode: "closed" });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const mobileSearch = useMobileSearchToggle();
  const sortOptions = useMemo<SortOption<"name" | "type">[]>(
    () => [
      { sortBy: "name", sortDir: "asc", label: t("accounts.sort.nameAsc") },
      { sortBy: "name", sortDir: "desc", label: t("accounts.sort.nameDesc") },
      { sortBy: "type", sortDir: "asc", label: t("accounts.sort.typeAsc") },
      { sortBy: "type", sortDir: "desc", label: t("accounts.sort.typeDesc") },
    ],
    [t],
  );

  const handleSelect = useCallback((id: string, account: Account) => {
    setDrawerState({ mode: "edit", id, account });
  }, []);

  const handleStartCreate = useCallback(() => {
    setDrawerState({ mode: "create" });
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerState({ mode: "closed" });
  }, []);

  const handleSuccess = useCallback((intent?: "archived") => {
    if (intent !== "archived") {
      setDrawerState({ mode: "closed" });
    }
    setRefreshKey((k) => k + 1);
  }, []);

  const isDrawerOpen = drawerState.mode !== "closed";
  const isCreating = drawerState.mode === "create";
  const selectedId = drawerState.mode === "edit" ? drawerState.id : null;
  const selectedAccount = drawerState.mode === "edit" ? drawerState.account : null;

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
            id="account-search"
            inputRef={mobileSearch.inputRef}
            label={t("common.search")}
            onBlur={mobileSearch.handleBlur}
            onChange={(search) => {
              patchFilters({ search });
            }}
            onFocus={mobileSearch.handleFocus}
            placeholder={t("accounts.searchPlaceholder")}
            value={filters.search}
          />
        ),
      },
      status: {
        kind: "select",
        label: t("common.status"),
        value: filters.status,
        defaultValue: ACTIVE_STATUS_FILTER,
        placement: "expanded",
        options: [
          { value: "ALL", label: t("common.all") },
          { value: "ACTIVE", label: t("common.active") },
          { value: "ARCHIVED", label: t("common.archived") },
        ],
        element: (
          <FilterSelectInput<StatusFilter>
            id="account-status-filter"
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
      type: {
        kind: "select",
        label: t("common.type"),
        value: filters.type,
        defaultValue: "",
        placement: "expanded",
        options: [
          { value: "CHECKING", label: t("accountTypes.CHECKING") },
          { value: "SAVINGS", label: t("accountTypes.SAVINGS") },
          { value: "CREDIT_CARD", label: t("accountTypes.CREDIT_CARD") },
          { value: "INVESTMENT", label: t("accountTypes.INVESTMENT") },
        ],
        element: (
          <FilterSelectInput<AccountType>
            id="account-type-filter"
            label={t("common.type")}
            onChange={(type) => {
              patchFilters({ type });
            }}
            options={[
              { value: "CHECKING", label: t("accountTypes.CHECKING") },
              { value: "SAVINGS", label: t("accountTypes.SAVINGS") },
              { value: "CREDIT_CARD", label: t("accountTypes.CREDIT_CARD") },
              { value: "INVESTMENT", label: t("accountTypes.INVESTMENT") },
            ]}
            placeholder={t("common.allTypes")}
            value={filters.type}
          />
        ),
      },
    }),
    [
      filters.search,
      filters.status,
      filters.type,
      mobileSearch.handleBlur,
      mobileSearch.handleFocus,
      mobileSearch.inputRef,
      patchFilters,
      t,
    ],
  );

  return (
    <AppShell
      mobileActionBarHidden={isDrawerOpen}
      mobileSearchDockVisible={mobileSearch.isOpen}
      mobileActions={{
        createLabel: t("accounts.new"),
        onCreate: handleStartCreate,
        onSearch: mobileSearch.open,
        searchExpanded: mobileSearch.isOpen,
      }}
      title={t("accounts.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("accounts.new")}
        </Button>
      }
    >
      <section className={styles.stack}>
        <Card className={styles.toolbarPanel}>
          <FilterToolbar
            actions={<SortAction onChange={setSort} options={sortOptions} value={sort} />}
            fields={fields}
            onDismissMobileSearchFocus={mobileSearch.blurInput}
            onCloseMobileSearch={mobileSearch.close}
            isMobileSearchFocused={mobileSearch.isFocused}
            isMobileSearchOpen={mobileSearch.isOpen}
            isPanelOpen={isFiltersOpen}
            onClosePanel={() => setIsFiltersOpen(false)}
            onResetField={(name, defaultValue) => {
              clearFilter(name as keyof AccountFilters, defaultValue as AccountFilters[keyof AccountFilters]);
            }}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
          />
        </Card>

        <AccountList filters={filters} sort={sort} selectedId={selectedId} onSelect={handleSelect} refreshKey={refreshKey} />

        {isDrawerOpen ? (
          <Drawer onClose={handleCloseDrawer} title={isCreating ? t("accounts.newTitle") : t("accounts.detailsTitle")}>
            <div className={styles.drawerStack}>
              <AccountForm
                account={selectedAccount}
                accountOptions={[]}
                user={user!}
                onSuccess={handleSuccess}
                onCancel={handleCloseDrawer}
              />
            </div>
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
