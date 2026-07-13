import { useCallback, useMemo, useState } from "react";
import type { Account, AccountType } from "../../app/api/accounts";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import FilterToolbar from "../../components/ui/FilterToolbar";
import FilterSelectInput from "../../components/ui/filterFields/FilterSelectInput";
import FilterTextInput from "../../components/ui/filterFields/FilterTextInput";
import { useI18n } from "../../app/i18n/I18nContext";
import { ACTIVE_STATUS_FILTER, type StatusFilter } from "../../lib/constants";
import type { FilterFields } from "../../lib/filterFields";
import { useFiltersState } from "../../lib/useFiltersState";
import AccountList from "./AccountList";
import AccountForm from "./AccountForm";
import styles from "./AccountsPage.module.scss";

type AccountFilters = {
  search: string;
  status: StatusFilter;
  type: "" | AccountType;
};

const DEFAULT_FILTERS: AccountFilters = {
  search: "",
  status: ACTIVE_STATUS_FILTER,
  type: "",
};

export default function AccountsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { filters, patchFilters, clearFilter } = useFiltersState(DEFAULT_FILTERS);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelect = useCallback((id: string, account: Account) => {
    setSelectedId(id);
    setSelectedAccount(account);
    setShowDrawer(true);
  }, []);

  const handleStartCreate = useCallback(() => {
    setSelectedId(null);
    setSelectedAccount(null);
    setShowDrawer(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedId(null);
    setSelectedAccount(null);
    setShowDrawer(false);
  }, []);

  const handleSuccess = useCallback((intent?: "archived") => {
    if (intent !== "archived") {
      setSelectedId(null);
      setSelectedAccount(null);
      setShowDrawer(false);
    }
    setRefreshKey((k) => k + 1);
  }, []);

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
            label={t("common.search")}
            onChange={(search) => {
              patchFilters({ search });
            }}
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
    [filters.search, filters.status, filters.type, patchFilters, t],
  );

  return (
    <AppShell
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
            fields={fields}
            isPanelOpen={isFiltersOpen}
            onClosePanel={() => setIsFiltersOpen(false)}
            onResetField={(name, defaultValue) => {
              clearFilter(name as keyof AccountFilters, defaultValue as AccountFilters[keyof AccountFilters]);
            }}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
          />
        </Card>

        <AccountList filters={filters} selectedId={selectedId} onSelect={handleSelect} refreshKey={refreshKey} />

        {showDrawer ? (
          <Drawer onClose={handleCloseDrawer} title={selectedId === null ? t("accounts.newTitle") : t("accounts.detailsTitle")}>
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
