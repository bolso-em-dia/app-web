import { useCallback, useMemo, useState } from "react";
import type { Account, AccountType } from "../../app/api/accounts";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";

import { useI18n } from "../../app/i18n/I18nContext";
import AccountList from "./AccountList";
import AccountForm from "./AccountForm";
import styles from "./AccountsPage.module.scss";

type AccountFilters = {
  search: string;
  status: "ALL" | "ACTIVE" | "ARCHIVED";
  type: "" | AccountType;
};

const DEFAULT_FILTERS: AccountFilters = { search: "", status: "ACTIVE", type: "" };

export default function AccountsPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [filters, setFilters] = useState<AccountFilters>(DEFAULT_FILTERS);
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
    () => [
      ...(filters.search
        ? [
            {
              key: "search",
              label: `${t("common.search")}: ${filters.search}`,
              onRemove: () => {
                setFilters((c) => ({ ...c, search: "" }));
              },
            },
          ]
        : []),
      ...(filters.status !== "ACTIVE"
        ? [
            {
              key: "status",
              label: `${t("common.status")}: ${t(
                filters.status === "ALL" ? "common.all" : "common.archived",
              )}`,
              onRemove: () => {
                setFilters((c) => ({ ...c, status: "ACTIVE" }));
              },
            },
          ]
        : []),
      ...(filters.type
        ? [
            {
              key: "type",
              label: `${t("common.type")}: ${t(`accountTypes.${filters.type}`)}`,
              onRemove: () => {
                setFilters((c) => ({ ...c, type: "" }));
              },
            },
          ]
        : []),
    ],
    [filters.search, filters.status, filters.type, t],
  );

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

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
            onClearFilters={clearFilters}
            onClosePanel={() => setIsFiltersOpen(false)}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
            primaryContent={
              <Field htmlFor="account-search" label={t("common.search")}>
                <Input
                  id="account-search"
                  onChange={(event) => {
                    setFilters((c) => ({ ...c, search: event.target.value }));
                  }}
                  placeholder={t("accounts.searchPlaceholder")}
                  value={filters.search}
                />
              </Field>
            }
            secondaryContent={
              <>
                <Field
                  htmlFor="account-status-filter"
                  label={t("common.status")}
                >
                  <Select
                    id="account-status-filter"
                    onChange={(event) => {
                      setFilters((c) => ({
                        ...c,
                        status: event.target.value as
                          | "ALL"
                          | "ACTIVE"
                          | "ARCHIVED",
                      }));
                    }}
                    value={filters.status}
                  >
                    <option value="ALL">{t("common.all")}</option>
                    <option value="ACTIVE">{t("common.active")}</option>
                    <option value="ARCHIVED">{t("common.archived")}</option>
                  </Select>
                </Field>
                <Field htmlFor="account-type-filter" label={t("common.type")}>
                  <Select
                    id="account-type-filter"
                    onChange={(event) => {
                      setFilters((c) => ({
                        ...c,
                        type: event.target.value as "" | AccountType,
                      }));
                    }}
                    value={filters.type}
                  >
                    <option value="">{t("common.allTypes")}</option>
                    <option value="CHECKING">
                      {t("accountTypes.CHECKING")}
                    </option>
                    <option value="SAVINGS">{t("accountTypes.SAVINGS")}</option>
                    <option value="CREDIT_CARD">
                      {t("accountTypes.CREDIT_CARD")}
                    </option>
                    <option value="INVESTMENT">
                      {t("accountTypes.INVESTMENT")}
                    </option>
                  </Select>
                </Field>
              </>
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
