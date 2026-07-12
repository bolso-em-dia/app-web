import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  listCategoryOptions,
  type CategoryOption,
} from "../../app/api/categories";
import { listAccountOptions, type AccountOption } from "../../app/api/accounts";
import {
  createFixedExpenseTemplate,
  deleteFixedExpenseTemplate,
  listFixedExpenseTemplates,
  updateFixedExpenseTemplate,
  type FixedExpenseTemplate,
  type FixedExpenseTemplateListParams,
  type FixedExpenseTemplatePayload,
} from "../../app/api/fixedExpenses";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ConfirmAction from "../../components/ui/ConfirmAction";
import CategorySelect from "../../components/ui/CategorySelect";
import Drawer from "../../components/ui/Drawer";
import CurrencyInput from "../../components/ui/CurrencyInput";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import MoneyAmount from "../../components/ui/MoneyAmount";
import PaginationBar from "../../components/ui/PaginationBar";
import { formatCurrency } from "../../lib/formatters/currency";
import {
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import {
  createFixedExpenseSchema,
  type FixedExpenseFormValues,
} from "../../lib/validation/fixedExpenseSchema";
import { useI18n } from "../../app/i18n/I18nContext";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";
import { usePagination } from "../../lib/usePagination";
import { getStoredIcon } from "../../lib/icons";
import styles from "./FixedExpensesPage.module.scss";

function createDefaultValues(defaultAccountId: string): FixedExpenseFormValues {
  return {
    name: "",
    type: "EXPENSE",
    amount: 0,
    categoryId: "",
    accountId: defaultAccountId,
    dueDay: 1,
  };
}


function mapFormValuesToPayload(
  values: FixedExpenseFormValues,
): FixedExpenseTemplatePayload {
  return {
    name: values.name,
    type: values.type,
    amount: values.amount,
    categoryId: values.categoryId,
    accountId: values.accountId,
    dueDay: values.dueDay,
  };
}

export default function FixedExpensesPage() {
  const { accessToken, user } = useAuth();
  const { t } = useI18n();
  const referenceMonth = getCurrentReferenceMonth();
  const [templates, setTemplates] = useState<FixedExpenseTemplate[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ACTIVE");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? null,
    [templates, selectedId],
  );

  const categoryOptionsById = useMemo(
    () => new Map(categoryOptions.map((category) => [category.id, category])),
    [categoryOptions],
  );

  const fixedExpenseSchema = useMemo(() => createFixedExpenseSchema(t), [t]);

  const form = useForm<FixedExpenseFormValues>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: createDefaultValues(user?.preferences.defaultAccountId ?? ""),
  });
  const selectedType = form.watch("type");
  const formAccountId = form.watch("accountId");
  const selectedAccountCurrency = useMemo(
    () => accountOptions.find((a) => a.id === formAccountId)?.currency as "BRL" | "USD" | undefined,
    [accountOptions, formAccountId],
  );

  const loadTemplates = useCallback(
    async (params: FixedExpenseTemplateListParams) => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [templatesResponse, categoriesResponse, accountsResponse] =
          await Promise.all([
            listFixedExpenseTemplates(params, accessToken),
            listCategoryOptions(referenceMonth, accessToken),
            listAccountOptions(referenceMonth, accessToken),
          ]);

        setTemplates(templatesResponse.items);
        setPage(templatesResponse.page);
        setPageSize(templatesResponse.size);
        setTotalItems(templatesResponse.totalItems);
        setCategoryOptions(categoriesResponse);
        setAccountOptions(accountsResponse);
        setSelectedId((current) =>
          current &&
          templatesResponse.items.some((template) => template.id === current)
            ? current
            : null,
        );
      } catch {
        setError(t("fixedTransactions.error"));
      } finally {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [accessToken, referenceMonth, t],
  );

  useEffect(() => {
    void loadTemplates({
      page,
      size: pageSize,
      search,
      status: statusFilter,
    });
  }, [loadTemplates, page, pageSize, search, statusFilter]);

  async function onSubmit(values: FixedExpenseFormValues) {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        await createFixedExpenseTemplate(mapFormValuesToPayload(values), accessToken);
        handleCloseDrawer();
        await loadTemplates({
          page,
          size: pageSize,
          search,
          status: statusFilter,
        });
      } else if (selectedTemplate) {
        await updateFixedExpenseTemplate(
          selectedTemplate.id,
          mapFormValuesToPayload(values),
          accessToken,
        );
        handleCloseDrawer();
        await loadTemplates({
          page,
          size: pageSize,
          search,
          status: statusFilter,
        });
      }
    } catch {
      setError(t("fixedTransactions.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function onDelete() {
    if (!accessToken || !selectedTemplate) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteFixedExpenseTemplate(selectedTemplate.id, accessToken);
      setSelectedId(null);
      await loadTemplates({
        page,
        size: pageSize,
        search,
        status: statusFilter,
      });
    } catch {
      setError(t("fixedTransactions.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  }

  function handleStartCreate() {
    setIsCreating(true);
    setSelectedId(null);
    setError(null);
    form.reset(createDefaultValues(user?.preferences.defaultAccountId ?? ""));
  }

  function handleCancelCreate() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
    form.reset(createDefaultValues(user?.preferences.defaultAccountId ?? ""));
  }

  function handleCloseDrawer() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
    form.reset(createDefaultValues(user?.preferences.defaultAccountId ?? ""));
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
    ],
    [search, statusFilter, t],
  );

  function clearFilters() {
    setSearch("");
    setStatusFilter("ACTIVE");
    setPage(0);
  }

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const pagination = usePagination(page, pageSize, totalItems, totalPages);

  return (
    <AppShell
      title={t("fixedTransactions.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("fixedTransactions.new")}
        </Button>
      }
    >
      {showInitialLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label={t("fixedTransactions.loading")} />
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
                <Field
                  htmlFor="fixed-expense-search"
                  label={t("common.search")}
                >
                  <Input
                    id="fixed-expense-search"
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(0);
                    }}
                    placeholder={t("fixedTransactions.searchPlaceholder")}
                    value={search}
                  />
                </Field>
              }
              secondaryContent={
                <>
                  <Field
                    htmlFor="fixed-expense-status-filter"
                    label={t("common.status")}
                  >
                    <Select
                      id="fixed-expense-status-filter"
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
                </>
              }
            />
          </Card>

          <section className={styles.templateGrid}>
            {templates.map((template) => {
              const categoryOption = categoryOptionsById.get(
                template.categoryId,
              );
              const CategoryIcon = getStoredIcon(categoryOption?.icon);
              const categoryColor = categoryOption?.color ?? undefined;

              return (
                <Card key={template.id} className={styles.templateCard}>
                  <button
                    className={styles.templateButton}
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedId(template.id);
                      setError(null);
                      form.reset({
                        name: template.name,
                        type: template.type,
                        amount: template.amount,
                        categoryId: template.categoryId,
                        accountId: template.accountId,
                        dueDay: template.dueDay,
                      });
                    }}
                    style={
                      categoryColor
                        ? { borderInlineStartColor: categoryColor }
                        : undefined
                    }
                    type="button"
                  >
                    <div className={styles.templateHeader}>
                      <div className={styles.templateMain}>
                        <div className={styles.templateTitleRow}>
                          {CategoryIcon ? (
                            <span
                              aria-hidden="true"
                              className={styles.categoryLead}
                              style={
                                categoryColor
                                  ? { color: categoryColor }
                                  : undefined
                              }
                            >
                              <CategoryIcon className={styles.categoryIcon} />
                            </span>
                          ) : categoryColor ? (
                            <span
                              aria-hidden="true"
                              className={styles.categoryLead}
                              style={{ color: categoryColor }}
                            >
                              <span className={styles.categoryDot} />
                            </span>
                          ) : null}
                          <div className={styles.templateLine}>
                            <strong className={styles.templateName}>
                              {template.name}
                            </strong>
                            <span className={styles.templateMetaSeparator}>
                              ·
                            </span>
                            <p className={styles.templateMeta}>
                              {template.categoryName} · {template.accountName} ·{" "}
                              {template.type === "INCOME"
                                ? t("fixedTransactions.receivesOnDay", {
                                    day: String(template.dueDay).padStart(2, "0"),
                                  })
                                : t("fixedTransactions.dueOnDay", {
                                    day: String(template.dueDay).padStart(2, "0"),
                                  })}
                              {template.currency === "USD" &&
                              template.exchangeRate != null
                                ? ` · ${formatCurrency(
                                    template.type === "EXPENSE"
                                      ? -Math.abs(template.amount)
                                      : Math.abs(template.amount),
                                    "USD",
                                  )} (cot. ${template.exchangeRate.toFixed(2)})`
                                : null}
                            </p>
                          </div>
                        </div>
                      </div>
                      <strong className={styles.templateAmount}>
                        <MoneyAmount amount={template.convertedAmount ?? template.amount} type={template.type} />
                      </strong>
                    </div>

                    <div className={styles.templateBadges}>
                      <span
                        className={
                          template.type === "INCOME"
                            ? `${styles.badge} ${styles.badgeSuccess}`
                            : styles.badge
                        }
                      >
                        {t(`transactionTypes.${template.type}`)}
                      </span>
                      <span
                        className={
                          template.archivedFromMonth
                            ? `${styles.badge} ${styles.badgeMuted}`
                            : `${styles.badge} ${styles.badgeSuccess}`
                        }
                      >
                        {template.archivedFromMonth
                          ? `Arquivado a partir de ${formatReferenceMonth(
                              template.archivedFromMonth,
                            )}`
                          : t("common.active")}
                      </span>
                    </div>
                  </button>
                </Card>
              );
            })}
          </section>

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
            showPageIndicator
            page={totalPages === 0 ? 0 : page + 1}
            totalPages={totalPages}
          />

          {isCreating || selectedTemplate ? (
            <Drawer
              description={
                isCreating
                  ? t("fixedTransactions.newDescription")
                  : t("fixedTransactions.editDescription")
              }
              onClose={handleCloseDrawer}
              title={
                isCreating
                  ? t("fixedTransactions.newTitle")
                  : t("fixedTransactions.detailsTitle")
              }
            >
              <div className={styles.drawerStack}>
                <form
                  className={styles.form}
                  onSubmit={form.handleSubmit(onSubmit)}
                  noValidate
                >
                  <Field
                    error={form.formState.errors.name?.message}
                    htmlFor="fixed-expense-name"
                    label={t("common.name")}
                  >
                    <Input
                      hasError={Boolean(form.formState.errors.name)}
                      id="fixed-expense-name"
                      {...form.register("name")}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.type?.message}
                    htmlFor="fixed-transaction-type"
                    label={t("common.type")}
                  >
                    <Select
                      hasError={Boolean(form.formState.errors.type)}
                      id="fixed-transaction-type"
                      {...form.register("type")}
                    >
                      <option value="EXPENSE">{t("transactionTypes.EXPENSE")}</option>
                      <option value="INCOME">{t("transactionTypes.INCOME")}</option>
                    </Select>
                  </Field>

                  <Field
                    error={form.formState.errors.amount?.message}
                    htmlFor="fixed-expense-amount"
                    label={t("fixedTransactions.amount")}
                  >
                    <Controller
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <CurrencyInput
                          currency={selectedAccountCurrency}
                          hasError={Boolean(form.formState.errors.amount)}
                          id="fixed-expense-amount"
                          onBlur={field.onBlur}
                          onValueChange={field.onChange}
                          ref={field.ref}
                          value={field.value}
                        />
                      )}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.categoryId?.message}
                    htmlFor="fixed-expense-category"
                    label={t("common.category")}
                  >
                    <Controller
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <CategorySelect
                          hasError={Boolean(form.formState.errors.categoryId)}
                          id="fixed-expense-category"
                          onChange={field.onChange}
                          options={categoryOptions}
                          placeholder={t("common.selectCategory")}
                          value={field.value}
                        />
                      )}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.accountId?.message}
                    htmlFor="fixed-expense-account"
                    label={t("common.account")}
                  >
                    <Select
                      hasError={Boolean(form.formState.errors.accountId)}
                      id="fixed-expense-account"
                      {...form.register("accountId")}
                    >
                      <option value="">{t("common.selectAccount")}</option>
                      {accountOptions.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field
                    error={form.formState.errors.dueDay?.message}
                    htmlFor="fixed-expense-due-day"
                    label={t(
                      selectedType === "INCOME"
                        ? "fixedTransactions.receiptDay"
                        : "accounts.dueDay",
                    )}
                  >
                    <Input
                      hasError={Boolean(form.formState.errors.dueDay)}
                      id="fixed-expense-due-day"
                      max="31"
                      min="1"
                      step="1"
                      type="number"
                      {...form.register("dueDay")}
                    />
                  </Field>

                  {error ? <FormError>{error}</FormError> : null}

                  <div className={styles.formActions}>
                    <Button loading={isSaving} type="submit">
                      {isCreating
                        ? t("fixedTransactions.create")
                        : t("common.saveChanges")}
                    </Button>
                    {isCreating ? (
                      <Button
                        onClick={handleCancelCreate}
                        type="button"
                        variant="subtle"
                      >
                        {t("common.cancel")}
                      </Button>
                    ) : null}
                    {!isCreating ? (
                      <Button
                        onClick={() => setIsDeleteConfirmOpen(true)}
                        type="button"
                        variant="danger"
                      >
                        {t("common.delete")}
                      </Button>
                    ) : null}
                  </div>
                </form>
              </div>
              <ConfirmAction
                confirmLabel={t("common.delete")}
                loading={isDeleting}
                message={t("confirmations.deleteFixedExpense")}
                onCancel={() => setIsDeleteConfirmOpen(false)}
                onConfirm={() => {
                  setIsDeleteConfirmOpen(false);
                  void onDelete();
                }}
                open={isDeleteConfirmOpen}
                title={t("fixedTransactions.deleteAction")}
              />
            </Drawer>
          ) : null}
        </section>
      )}
    </AppShell>
  );
}
