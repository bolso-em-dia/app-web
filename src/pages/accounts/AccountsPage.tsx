import { useCallback, useMemo, useState } from "react";
import type { Account, AccountType } from "../../app/api/accounts";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import FilterToolbar from "../../components/ui/FilterToolbar";
import { useI18n } from "../../app/i18n/I18nContext";
import { ACTIVE_STATUS_FILTER, type StatusFilter } from "../../lib/constants";
import {
  buildSearchActiveFilter,
  buildStatusActiveFilter,
  buildTypeActiveFilter,
  compileActiveFilters,
} from "../../lib/activeFilters";
import { useFiltersState } from "../../lib/useFiltersState";
import AccountList from "./AccountList";
import AccountForm from "./AccountForm";
import {
  AccountFiltersPrimary,
  AccountFiltersSecondary,
} from "./AccountFiltersContent";
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
  const { filters, patchFilters, clearFilter, resetFilters } =
    useFiltersState(DEFAULT_FILTERS);

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

  const activeFilters = useMemo(
    () =>
      compileActiveFilters([
        buildSearchActiveFilter(filters.search, t("common.search"), () => {
          clearFilter("search", "");
        }),
        buildStatusActiveFilter(filters.status, t, () => {
          clearFilter("status", ACTIVE_STATUS_FILTER);
        }),
        buildTypeActiveFilter(
          "type",
          filters.type,
          filters.type
            ? `${t("common.type")}: ${t(`accountTypes.${filters.type}` as const)}`
            : "",
          () => {
            clearFilter("type", "" as "" | AccountType);
          },
        ),
      ]),
    [filters.search, filters.status, filters.type, t, clearFilter],
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
            activeFilters={activeFilters}
            isPanelOpen={isFiltersOpen}
            onClearFilters={() => resetFilters()}
            onClosePanel={() => setIsFiltersOpen(false)}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
            primaryContent={
              <AccountFiltersPrimary
                filters={filters}
                onFiltersChange={patchFilters}
              />
            }
            secondaryContent={
              <AccountFiltersSecondary
                filters={filters}
                onFiltersChange={patchFilters}
              />
            }
          />
        </Card>

        <AccountList
          filters={filters}
          selectedId={selectedId}
          onSelect={handleSelect}
          refreshKey={refreshKey}
        />

        {showDrawer ? (
          <Drawer
            description={
              selectedId === null
                ? t("accounts.newDescription")
                : t("accounts.editDescription")
            }
            onClose={handleCloseDrawer}
            title={
              selectedId === null
                ? t("accounts.newTitle")
                : t("accounts.detailsTitle")
            }
          >
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
