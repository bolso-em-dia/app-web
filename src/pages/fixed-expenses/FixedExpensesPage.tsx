import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  listCategoryOptions,
  type CategoryOption,
} from "../../app/api/categories";
import { listAccountOptions, type AccountOption } from "../../app/api/accounts";
import {
  archiveFixedExpenseTemplate,
  createFixedExpenseTemplate,
  listFixedExpenseTemplateById,
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
import Drawer from "../../components/ui/Drawer";
import CurrencyInput from "../../components/ui/CurrencyInput";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { formatCurrency } from "../../lib/formatters/currency";
import {
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import { fixedExpenseSchema, type FixedExpenseFormValues } from "../../lib/validation/fixedExpenseSchema";
import { useI18n } from "../../app/i18n/I18nContext";
import styles from "./FixedExpensesPage.module.scss";

const DEFAULT_VALUES: FixedExpenseFormValues = {
  name: "",
  amount: 0,
  categoryId: "",
  accountId: "",
  dueDay: 1,
};
const DEFAULT_PAGE_SIZE = 12;

function mapFormValuesToPayload(
  values: FixedExpenseFormValues,
): FixedExpenseTemplatePayload {
  return {
    name: values.name,
    amount: values.amount,
    categoryId: values.categoryId,
    accountId: values.accountId,
    dueDay: values.dueDay,
  };
}

export default function FixedExpensesPage() {
  const { accessToken } = useAuth();
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
  const [totalPages, setTotalPages] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? null,
    [templates, selectedId],
  );

  const form = useForm<FixedExpenseFormValues>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: DEFAULT_VALUES,
  });

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
        setTotalPages(templatesResponse.totalPages);
        setCategoryOptions(categoriesResponse);
        setAccountOptions(accountsResponse);
        setSelectedId((current) =>
          current &&
          templatesResponse.items.some((template) => template.id === current)
            ? current
            : null,
        );
      } catch {
        setError(t("fixedExpenses.error"));
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

  useEffect(() => {
    if (isCreating) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (selectedTemplate) {
      form.reset({
        name: selectedTemplate.name,
        amount: selectedTemplate.amount,
        categoryId: selectedTemplate.categoryId,
        accountId: selectedTemplate.accountId,
        dueDay: selectedTemplate.dueDay,
      });
    }
  }, [form, isCreating, selectedTemplate]);

  async function onSubmit(values: FixedExpenseFormValues) {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        const created = await createFixedExpenseTemplate(
          mapFormValuesToPayload(values),
          accessToken,
        );
        const detailed = await listFixedExpenseTemplateById(
          created.id,
          accessToken,
        );
        setSelectedId(detailed.id);
        setIsCreating(false);
        await loadTemplates({
          page,
          size: pageSize,
          search,
          status: statusFilter,
        });
      } else if (selectedTemplate) {
        const updated = await updateFixedExpenseTemplate(
          selectedTemplate.id,
          mapFormValuesToPayload(values),
          accessToken,
        );
        setSelectedId(updated.id);
        await loadTemplates({
          page,
          size: pageSize,
          search,
          status: statusFilter,
        });
      }
    } catch {
      setError(t("fixedExpenses.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function onArchive() {
    if (
      !accessToken ||
      !selectedTemplate ||
      selectedTemplate.archivedFromMonth
    ) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      const archived = await archiveFixedExpenseTemplate(
        selectedTemplate.id,
        accessToken,
      );
      setSelectedId(archived.id);
      await loadTemplates({
        page,
        size: pageSize,
        search,
        status: statusFilter,
      });
    } catch {
      setError(t("fixedExpenses.archiveError"));
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

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const rangeStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const rangeEnd =
    totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);
  const hasPreviousPage = page > 0;
  const hasNextPage = page + 1 < totalPages;

  return (
    <AppShell
      title={t("fixedExpenses.title")}
      subtitle={t("fixedExpenses.subtitle")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("fixedExpenses.new")}
        </Button>
      }
    >
      {showInitialLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label={t("fixedExpenses.loading")} />
        </Card>
      ) : (
        <section className={styles.stack}>
          <Card className={styles.toolbarPanel}>
            <div className={styles.toolbar}>
              <div className={styles.filterGroup}>
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
                    placeholder={t("fixedExpenses.searchPlaceholder")}
                    value={search}
                  />
                </Field>

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
              </div>
            </div>
          </Card>

          <section className={styles.templateGrid}>
            {templates.map((template) => (
              <Card key={template.id} className={styles.templateCard}>
                <button
                  className={styles.templateButton}
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedId(template.id);
                    setError(null);
                  }}
                  type="button"
                >
                  <div className={styles.templateHeader}>
                    <div>
                      <strong>{template.name}</strong>
                      <p className={styles.templateMeta}>
                        {template.categoryName} · {template.accountName}
                      </p>
                    </div>
                    <strong>{formatCurrency(template.amount)}</strong>
                  </div>

                  <div className={styles.templateBadges}>
                    <span className={styles.badge}>
                      Vence no dia {template.dueDay}
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
            ))}
          </section>

          <Card className={styles.footerPanel}>
            <div className={styles.footerBar}>
              <p className={styles.resultSummary}>
                {totalItems === 0
                  ? t("fixedExpenses.empty")
                  : t("common.range", {
                      start: rangeStart,
                      end: rangeEnd,
                      total: totalItems,
                    })}
              </p>

              <div className={styles.paginationControls}>
                <label
                  className={styles.pageSizeControl}
                  htmlFor="fixed-expense-page-size"
                >
                  <span className={styles.pageSizeLabel}>
                    {t("common.rows")}
                  </span>
                  <Select
                    className={styles.pageSizeSelect}
                    id="fixed-expense-page-size"
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

                <div className={styles.pageButtons}>
                  <Button
                    disabled={!hasPreviousPage}
                    onClick={() => setPage((current) => current - 1)}
                    type="button"
                    variant="secondary"
                  >
                    {t("common.previous")}
                  </Button>
                  <span className={styles.pageIndicator}>
                    {t("common.pageOf", {
                      page: totalPages === 0 ? 0 : page + 1,
                      total: totalPages,
                    })}
                  </span>
                  <Button
                    disabled={!hasNextPage}
                    onClick={() => setPage((current) => current + 1)}
                    type="button"
                    variant="secondary"
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {isCreating || selectedTemplate ? (
            <Drawer
              description={
                isCreating
                  ? t("fixedExpenses.newDescription")
                  : t("fixedExpenses.editDescription")
              }
              onClose={handleCloseDrawer}
              title={
                isCreating
                  ? t("fixedExpenses.newTitle")
                  : t("fixedExpenses.detailsTitle")
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
                    error={form.formState.errors.amount?.message}
                    htmlFor="fixed-expense-amount"
                    label={t("fixedExpenses.amount")}
                  >
                    <Controller
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <CurrencyInput
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
                    <Select
                      hasError={Boolean(form.formState.errors.categoryId)}
                      id="fixed-expense-category"
                      {...form.register("categoryId")}
                    >
                      <option value="">{t("common.selectCategory")}</option>
                      {categoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
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
                    label={t("accounts.dueDay")}
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
                        ? t("fixedExpenses.create")
                        : t("common.saveChanges")}
                    </Button>
                    {isCreating ? (
                      <Button
                        onClick={handleCancelCreate}
                        type="button"
                        variant="secondary"
                      >
                        {t("common.cancel")}
                      </Button>
                    ) : (
                      <Button
                        disabled={Boolean(selectedTemplate?.archivedFromMonth)}
                        loading={isArchiving}
                        onClick={() => void onArchive()}
                        type="button"
                        variant="secondary"
                      >
                        {selectedTemplate?.archivedFromMonth
                          ? t("fixedExpenses.archived")
                          : t("fixedExpenses.archiveAction")}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </Drawer>
          ) : null}
        </section>
      )}
    </AppShell>
  );
}
