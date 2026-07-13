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
import type { AccountFormValues } from "../../lib/validation/accountSchema";
import { useI18n } from "../../app/i18n/I18nContext";
import AccountList from "./AccountList";
import AccountForm from "./AccountForm";
import styles from "./AccountsPage.module.scss";

const DEFAULT_VALUES: AccountFormValues = {
  name: "",
  type: "CHECKING",
  currency: "BRL",
  brand: "",
  color: "",
  closingDay: undefined,
  dueDay: undefined,
};

export default function AccountsPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ACTIVE");
  const [typeFilter, setTypeFilter] = useState<"" | AccountType>("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelect = useCallback((id: string, account: Account) => {
    setIsCreating(false);
    setSelectedId(id);
    setSelectedAccount(account);
  }, []);

  const handleStartCreate = useCallback(() => {
    setIsCreating(true);
    setSelectedId(null);
    setSelectedAccount(null);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsCreating(false);
    setSelectedId(null);
    setSelectedAccount(null);
  }, []);

  const handleSuccess = useCallback(() => {
    setIsCreating(false);
    setSelectedId(null);
    setSelectedAccount(null);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const activeFilters = useMemo(
    () => [
      ...(search
        ? [
            {
              key: "search",
              label: `${t("common.search")}: ${search}`,
              onRemove: () => {
                setSearch("");
              },
            },
          ]
        : []),
      ...(statusFilter !== "ACTIVE"
        ? [
            {
              key: "status",
              label: `${t("common.status")}: ${t(
                statusFilter === "ALL" ? "common.all" : "common.archived",
              )}`,
              onRemove: () => {
                setStatusFilter("ACTIVE");
              },
            },
          ]
        : []),
      ...(typeFilter
        ? [
            {
              key: "type",
              label: `${t("common.type")}: ${t(`accountTypes.${typeFilter}`)}`,
              onRemove: () => {
                setTypeFilter("");
              },
            },
          ]
        : []),
    ],
    [search, statusFilter, t, typeFilter],
  );

  function clearFilters() {
    setSearch("");
    setStatusFilter("ACTIVE");
    setTypeFilter("");
  }

  const isDrawerOpen = isCreating || selectedAccount !== null;

  const initialValues = isCreating
    ? DEFAULT_VALUES
    : selectedAccount
      ? {
          name: selectedAccount.name,
          type: selectedAccount.type,
          currency: (selectedAccount.currency as "BRL" | "USD") ?? "BRL",
          brand: selectedAccount.brand ?? "",
          color: selectedAccount.color ?? "",
          closingDay: selectedAccount.closingDay ?? undefined,
          dueDay: selectedAccount.dueDay ?? undefined,
        }
      : null;

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
                    setSearch(event.target.value);
                  }}
                  placeholder={t("accounts.searchPlaceholder")}
                  value={search}
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
                      setStatusFilter(
                        event.target.value as "ALL" | "ACTIVE" | "ARCHIVED",
                      );
                    }}
                    value={statusFilter}
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
                      setTypeFilter(event.target.value as "" | AccountType);
                    }}
                    value={typeFilter}
                  >
                    <option value="">{t("common.allTypes")}</option>
                    <option value="CHECKING">
                      {t("accountTypes.CHECKING")}
                    </option>
                    <option value="SAVINGS">
                      {t("accountTypes.SAVINGS")}
                    </option>
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
          search={search}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          selectedId={selectedId}
          onSelect={handleSelect}
          refreshKey={refreshKey}
        />

        {isDrawerOpen ? (
          <Drawer
            description={
              isCreating
                ? t("accounts.newDescription")
                : t("accounts.editDescription")
            }
            onClose={handleCloseDrawer}
            title={
              isCreating ? t("accounts.newTitle") : t("accounts.detailsTitle")
            }
          >
            <div className={styles.drawerStack}>
              <AccountForm
                initialValues={initialValues}
                editingAccountId={
                  isCreating || !selectedAccount ? null : selectedAccount.id
                }
                editingAccount={selectedAccount}
                user={user!}
                onSuccess={handleSuccess}
                onRefresh={handleRefresh}
                onCancel={handleCloseDrawer}
              />
            </div>
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
