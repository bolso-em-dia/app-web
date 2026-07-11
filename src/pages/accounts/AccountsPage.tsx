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
import ColorSwatchSelect from "../../components/ui/ColorSwatchSelect";
import ConfirmAction from "../../components/ui/ConfirmAction";
import Drawer from "../../components/ui/Drawer";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { formatReferenceMonth } from "../../lib/formatters/date";
import { COLOR_OPTIONS, getColorLabel } from "../../lib/uiOptions";
import {
  createAccountSchema,
  type AccountFormValues,
} from "../../lib/validation/accountSchema";
import { useI18n } from "../../app/i18n/I18nContext";
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
const DEFAULT_PAGE_SIZE = 12;

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
  const [totalPages, setTotalPages] = useState(0);
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
        setTotalPages(response.totalPages);
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

  useEffect(() => {
    if (isCreating) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (selectedAccount) {
      form.reset({
        name: selectedAccount.name,
        type: selectedAccount.type,
        currency: (selectedAccount.currency as "BRL" | "USD") ?? "BRL",
        brand: selectedAccount.brand ?? "",
        color: selectedAccount.color ?? "",
        closingDay: selectedAccount.closingDay ?? undefined,
        dueDay: selectedAccount.dueDay ?? undefined,
      });
    }
  }, [form, isCreating, selectedAccount]);

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
  }

  function handleCancelCreate() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
  }

  function handleCloseDrawer() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
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
  const rangeStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const rangeEnd =
    totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);
  const hasPreviousPage = page > 0;
  const hasNextPage = page + 1 < totalPages;

  return (
    <AppShell
      title={t("accounts.title")}
      subtitle={t("accounts.subtitle")}
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

          <section className={styles.accountGrid}>
            {accounts.length === 0 ? (
              <Card className={styles.emptyState}>
                <p>{t("accounts.empty")}</p>
              </Card>
            ) : (
              accounts.map((account) => (
                <Card key={account.id} className={styles.accountCard}>
                  <button
                    className={styles.accountButton}
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedId(account.id);
                      setError(null);
                    }}
                    style={
                      account.color
                        ? { borderInlineStartColor: account.color }
                        : undefined
                    }
                    type="button"
                  >
                    <div className={styles.accountHeader}>
                      <div>
                        <div className={styles.accountTitleRow}>
                          {account.color ? (
                            <span
                              aria-hidden="true"
                              className={styles.swatchDot}
                              style={{ backgroundColor: account.color }}
                            />
                          ) : null}
                          <strong>{account.name}</strong>
                        </div>
                        <p className={styles.accountMeta}>
                          {t(`accountTypes.${account.type}` as const)}
                          {account.brand ? ` · ${account.brand}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className={styles.accountBadges}>
                      <span className={styles.badge}>
                        {t(`accountTypes.${account.type}` as const)}
                      </span>
                      {account.closingDay && account.dueDay ? (
                        <span className={`${styles.badge} ${styles.badgeInfo}`}>
                          Fecha {account.closingDay} · Vence {account.dueDay}
                        </span>
                      ) : null}
                      <span
                        className={
                          account.archivedFromMonth
                            ? `${styles.badge} ${styles.badgeMuted}`
                            : `${styles.badge} ${styles.badgeSuccess}`
                        }
                      >
                        {account.archivedFromMonth
                          ? `Arquivado a partir de ${formatReferenceMonth(account.archivedFromMonth)}`
                          : t("common.active")}
                      </span>
                    </div>
                  </button>
                </Card>
              ))
            )}
          </section>

          <Card className={styles.footerPanel}>
            <div className={styles.footer}>
              <span className={styles.rangeLabel}>
                {t("common.range", {
                  start: rangeStart,
                  end: rangeEnd,
                  total: totalItems,
                })}
              </span>

              <div className={styles.paginationControls}>
                <label className={styles.rowsControl}>
                  <span>{t("common.rows")}</span>
                  <Select
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(0);
                    }}
                    value={String(pageSize)}
                  >
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="48">48</option>
                  </Select>
                </label>

                <div className={styles.paginationButtons}>
                  <Button
                    disabled={!hasPreviousPage}
                    onClick={() => setPage((current) => current - 1)}
                    type="button"
                    variant="subtle"
                  >
                    {t("common.previous")}
                  </Button>
                  <Button
                    disabled={!hasNextPage}
                    onClick={() => setPage((current) => current + 1)}
                    type="button"
                    variant="subtle"
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {isCreating || selectedAccount ? (
            <>
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
                <form
                  className={styles.form}
                  noValidate
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <Field
                    error={form.formState.errors.name?.message}
                    htmlFor="account-name"
                    label={t("common.name")}
                  >
                    <Input
                      id="account-name"
                      {...form.register("name")}
                      hasError={Boolean(form.formState.errors.name)}
                      placeholder={t("accounts.placeholder")}
                    />
                  </Field>

                  <div className={styles.typeGrid}>
                    <Field
                      error={form.formState.errors.type?.message}
                      htmlFor="account-type"
                      label={t("common.type")}
                    >
                      <Select
                        id="account-type"
                        {...form.register("type")}
                        hasError={Boolean(form.formState.errors.type)}
                      >
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

                    {user?.preferences.showForeignCurrency ? (
                      <Field htmlFor="account-currency" label="Moeda">
                        <Select id="account-currency" {...form.register("currency")}>
                          <option value="BRL">Real (BRL)</option>
                          <option value="USD">Dólar (USD)</option>
                        </Select>
                      </Field>
                    ) : null}

                    <Field
                      error={form.formState.errors.color?.message}
                      htmlFor="account-color"
                      label={t("accounts.color")}
                    >
                      <ColorSwatchSelect
                        clearLabel={t("common.clearSelection")}
                        id="account-color"
                        onChange={(value) =>
                          form.setValue("color", value, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                        }
                        options={COLOR_OPTIONS}
                        value={colorValue}
                      />
                    </Field>
                  </div>

                  {isCreditCard ? (
                    <div className={styles.cardFields}>
                      <Field
                        error={form.formState.errors.brand?.message}
                        htmlFor="account-brand"
                        label={t("accounts.brand")}
                      >
                        <Input
                          id="account-brand"
                          {...form.register("brand")}
                          hasError={Boolean(form.formState.errors.brand)}
                          placeholder="Visa"
                        />
                      </Field>

                      <Field
                        error={form.formState.errors.closingDay?.message}
                        htmlFor="account-closing-day"
                        label={t("accounts.closingDay")}
                      >
                        <Input
                          id="account-closing-day"
                          {...form.register("closingDay")}
                          hasError={Boolean(form.formState.errors.closingDay)}
                          inputMode="numeric"
                          max={31}
                          min={1}
                          type="number"
                        />
                      </Field>

                      <Field
                        error={form.formState.errors.dueDay?.message}
                        htmlFor="account-due-day"
                        label={t("accounts.dueDay")}
                      >
                        <Input
                          id="account-due-day"
                          {...form.register("dueDay")}
                          hasError={Boolean(form.formState.errors.dueDay)}
                          inputMode="numeric"
                          max={31}
                          min={1}
                          type="number"
                        />
                      </Field>
                    </div>
                  ) : null}

                  {colorValue ? (
                    <div className={styles.swatch}>
                      <span
                        className={styles.swatchDot}
                        style={{ backgroundColor: colorValue }}
                      />
                      <span>
                        {getColorLabel(colorValue) ||
                          t("common.clearSelection")}
                      </span>
                    </div>
                  ) : null}

                  <FormError>{error}</FormError>

                  <div className={styles.formActions}>
                    <Button disabled={isSaving} type="submit">
                      {isCreating
                        ? t("accounts.create")
                        : t("common.save")}
                    </Button>
                    {isCreating ? (
                      <Button
                        onClick={handleCancelCreate}
                        type="button"
                        variant="subtle"
                      >
                        {t("common.cancel")}
                      </Button>
                    ) : (
                      <Button
                        disabled={
                          Boolean(selectedAccount?.archivedFromMonth)
                        }
                        onClick={() => setIsArchiveConfirmOpen(true)}
                        type="button"
                        variant={
                          selectedAccount?.archivedFromMonth
                            ? "subtle"
                            : "danger"
                        }
                      >
                        {selectedAccount?.archivedFromMonth
                          ? t("accounts.archived")
                          : t("common.archive")}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </Drawer>
            <ConfirmAction
              confirmLabel={t("common.archive")}
              loading={isArchiving}
              message={t("confirmations.archiveAccount")}
              onCancel={() => setIsArchiveConfirmOpen(false)}
              onConfirm={() => {
                setIsArchiveConfirmOpen(false);
                void onArchive();
              }}
              open={isArchiveConfirmOpen}
              title={t("accounts.archiveTitle")}
            />
            </>
          ) : null}
        </section>
      )}
    </AppShell>
  );
}
