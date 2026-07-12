import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  archiveAccount,
  createAccount,
  listAccountPage,
  type Account,
  type AccountListParams,
  type AccountPayload,
  type AccountType,
  updateAccount,
} from "../../app/api/accounts";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ConfirmAction from "../../components/ui/ConfirmAction";
import Drawer from "../../components/ui/Drawer";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import PaginationBar from "../../components/ui/PaginationBar";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import {
  createAccountSchema,
  type AccountFormValues,
} from "../../lib/validation/accountSchema";
import { useI18n } from "../../app/i18n/I18nContext";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";
import { usePagination } from "../../lib/usePagination";
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


function mapFormValuesToPayload(values: AccountFormValues): AccountPayload {
  return {
    name: values.name,
    type: values.type,
    currency: values.currency,
    brand: values.brand || undefined,
    color: values.color || undefined,
    closingDay: values.type === "CREDIT_CARD" ? values.closingDay : undefined,
    dueDay: values.type === "CREDIT_CARD" ? values.dueDay : undefined,
  };
}

export default function AccountsPage() {
  const { accessToken, user } = useAuth();
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ACTIVE");
  const [typeFilter, setTypeFilter] = useState<"" | AccountType>("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedId) ?? null,
    [accounts, selectedId],
  );

  const accountSchema = useMemo(() => createAccountSchema(t), [t]);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const accountType = form.watch("type");
  const colorValue = form.watch("color");
  const isCreditCard = accountType === "CREDIT_CARD";

  const loadAccounts = useCallback(
    async (params: AccountListParams) => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await listAccountPage(params, accessToken);
        setAccounts(response.items);
        setPage(response.page);
        setPageSize(response.size);
        setTotalItems(response.totalItems);
        setSelectedId((current) =>
          current && response.items.some((account) => account.id === current)
            ? current
            : null,
        );
      } catch {
        setError(t("accounts.error"));
      } finally {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [accessToken, t],
  );

  useEffect(() => {
    void loadAccounts({
      page,
      size: pageSize,
      search,
      status: statusFilter,
      type: typeFilter || undefined,
    });
  }, [loadAccounts, page, pageSize, search, statusFilter, typeFilter]);

  async function onSubmit(values: AccountFormValues) {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        await createAccount(mapFormValuesToPayload(values), accessToken);
        handleCloseDrawer();
        await loadAccounts({
          page,
          size: pageSize,
          search,
          status: statusFilter,
          type: typeFilter || undefined,
        });
      } else if (selectedAccount) {
        await updateAccount(
          selectedAccount.id,
          mapFormValuesToPayload(values),
          accessToken,
        );
        handleCloseDrawer();
        await loadAccounts({
          page,
          size: pageSize,
          search,
          status: statusFilter,
          type: typeFilter || undefined,
        });
      }
    } catch {
      setError(t("accounts.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function onArchive() {
    if (!accessToken || !selectedAccount || selectedAccount.archivedFromMonth) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      const archived = await archiveAccount(selectedAccount.id, accessToken);
      setSelectedId(archived.id);
      await loadAccounts({
        page,
        size: pageSize,
        search,
        status: statusFilter,
        type: typeFilter || undefined,
      });
    } catch {
      setError(t("accounts.archiveError"));
    } finally {
      setIsArchiving(false);
    }
  }

  function handleStartCreate() {
    setIsCreating(true);
    setSelectedId(null);
    setError(null);
    form.reset(DEFAULT_VALUES);
  }

  function handleCancelCreate() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
    form.reset(DEFAULT_VALUES);
  }

  function handleCloseDrawer() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
    form.reset(DEFAULT_VALUES);
  }

  const activeFilters = useMemo(
    () => [
      ...(search
        ? [
            {
              key: "search",
              label: `${t("common.search")}: ${search}`,
              onRemove: () => {
                setSearch("");
                setPage(0);
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
                setPage(0);
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
                setPage(0);
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
    setPage(0);
  }

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const pagination = usePagination(page, pageSize, totalItems, totalPages);

  return (
    <AppShell
      title={t("accounts.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("accounts.new")}
        </Button>
      }
    >
      {showInitialLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label={t("accounts.loading")} />
        </Card>
      ) : (
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
                      setPage(0);
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
                        setPage(0);
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
                        setPage(0);
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
            accounts={accounts}
            selectedId={selectedId}
            emptyMessage={t("accounts.empty")}
            onCardSelect={(id, account) => {
              setIsCreating(false);
              setSelectedId(id);
              setError(null);
              form.reset({
                name: account.name,
                type: account.type,
                currency: (account.currency as "BRL" | "USD") ?? "BRL",
                brand: account.brand ?? "",
                color: account.color ?? "",
                closingDay: account.closingDay ?? undefined,
                dueDay: account.dueDay ?? undefined,
              });
            }}
          />

          <PaginationBar
            start={pagination.rangeStart}
            end={pagination.rangeEnd}
            total={totalItems}
            pageSize={pageSize}
            hasPrevious={pagination.hasPreviousPage}
            hasNext={pagination.hasNextPage}
            onPrevious={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(0);
            }}
          />

          {isCreating || selectedAccount ? (
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
                  error={error}
                  form={form}
                  isArchiveConfirmOpen={isArchiveConfirmOpen}
                  isArchiving={isArchiving}
                  isCreating={isCreating}
                  isSaving={isSaving}
                  onCancelCreate={handleCancelCreate}
                  onArchiveCancel={() => setIsArchiveConfirmOpen(false)}
                  onArchiveConfirm={() => {
                    setIsArchiveConfirmOpen(false);
                    void onArchive();
                  }}
                  onArchiveOpen={() => setIsArchiveConfirmOpen(true)}
                  onSubmit={onSubmit}
                  selectedAccount={selectedAccount}
                  showForeignCurrency={user?.preferences.showForeignCurrency ?? false}
                />
              </div>
            </Drawer>
          ) : null}
        </section>
      )}
    </AppShell>
  );
}
