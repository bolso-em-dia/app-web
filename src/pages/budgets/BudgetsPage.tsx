import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  listCategoryOptions,
  type CategoryOption,
} from "../../app/api/categories";
import { listFamilyMembers, type FamilyMember } from "../../app/api/family";
import {
  archiveBudget,
  createBudget,
  getBudget,
  listBudgetCategoryBreakdown,
  listBudgets,
  updateBudget,
  type Budget,
  type BudgetCategoryBreakdown,
  type BudgetListParams,
  type BudgetPayload,
  type BudgetType,
} from "../../app/api/budgets";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ConfirmAction from "../../components/ui/ConfirmAction";
import CategoryMultiSelect from "../../components/ui/CategoryMultiSelect";
import Drawer from "../../components/ui/Drawer";
import MonthSelector from "../../components/ui/MonthSelector";
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
  formatDay,
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import {
  createBudgetSchema,
  type BudgetFormValues,
} from "../../lib/validation/budgetSchema";
import { useI18n } from "../../app/i18n/I18nContext";
import styles from "./BudgetsPage.module.scss";

const DEFAULT_VALUES: BudgetFormValues = {
  name: "",
  type: "GLOBAL",
  ownerMemberId: "",
  categoryIds: [],
  monthlyLimit: 0,
};
const DEFAULT_PAGE_SIZE = 12;

function mapFormValuesToPayload(values: BudgetFormValues): BudgetPayload {
  return {
    name: values.name,
    type: values.type,
    ownerMemberId:
      values.type === "ALLOWANCE" && values.ownerMemberId
        ? values.ownerMemberId
        : undefined,
    categoryIds: values.type === "GLOBAL" ? values.categoryIds : undefined,
    monthlyLimit: values.monthlyLimit,
  };
}

export default function BudgetsPage() {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const initialReferenceMonth = useMemo(() => getCurrentReferenceMonth(), []);
  const [referenceMonth, setReferenceMonth] = useState(initialReferenceMonth);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    BudgetCategoryBreakdown[]
  >([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ACTIVE");
  const [typeFilter, setTypeFilter] = useState<"" | BudgetType>("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBudgetSummary = useMemo(
    () => budgets.find((budget) => budget.id === selectedId) ?? null,
    [budgets, selectedId],
  );

  const budgetSchema = useMemo(() => createBudgetSchema(t), [t]  );
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const budgetType = form.watch("type");

  const availableAllowanceMembers = useMemo(
    () => members.filter((member) => member.active && member.allowanceEnabled),
    [members],
  );

  const loadBudgetsData = useCallback(
    async (params: BudgetListParams) => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [budgetsResponse, categoryOptionsResponse, membersResponse] =
          await Promise.all([
            listBudgets(params, accessToken),
            listCategoryOptions(params.referenceMonth, accessToken),
            listFamilyMembers(accessToken),
          ]);

        setBudgets(budgetsResponse.items);
        setPage(budgetsResponse.page);
        setPageSize(budgetsResponse.size);
        setTotalItems(budgetsResponse.totalItems);
        setTotalPages(budgetsResponse.totalPages);
        setCategoryOptions(categoryOptionsResponse);
        setMembers(membersResponse);
        setSelectedId((current) =>
          current &&
          budgetsResponse.items.some((budget) => budget.id === current)
            ? current
            : null,
        );
      } catch {
        setError(t("budgets.error"));
      } finally {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [accessToken, t],
  );

  const loadBudgetDetails = useCallback(async () => {
    if (!accessToken || !selectedId || isCreating) {
      setSelectedBudget(null);
      setCategoryBreakdown([]);
      return;
    }

    setIsDetailLoading(true);

    try {
      const [budgetResponse, categoryBreakdownResponse] = await Promise.all([
        getBudget(selectedId, referenceMonth, accessToken),
        listBudgetCategoryBreakdown(selectedId, referenceMonth, accessToken),
      ]);
      setSelectedBudget(budgetResponse);
      setCategoryBreakdown(categoryBreakdownResponse);
    } catch {
      setError(t("budgets.detailsError"));
      setSelectedBudget(null);
      setCategoryBreakdown([]);
    } finally {
      setIsDetailLoading(false);
    }
  }, [accessToken, isCreating, referenceMonth, selectedId, t]);

  useEffect(() => {
    void loadBudgetsData({
      referenceMonth,
      page,
      size: pageSize,
      search,
      status: statusFilter,
      type: typeFilter || undefined,
    });
  }, [
    loadBudgetsData,
    page,
    pageSize,
    referenceMonth,
    search,
    statusFilter,
    typeFilter,
  ]);

  useEffect(() => {
    void loadBudgetDetails();
  }, [loadBudgetDetails]);

  useEffect(() => {
    if (isCreating) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (selectedBudget) {
      form.reset({
        name: selectedBudget.name,
        type: selectedBudget.type,
        ownerMemberId: selectedBudget.ownerMemberId ?? "",
        categoryIds: selectedBudget.categories.map((category) => category.id),
        monthlyLimit: selectedBudget.monthlyLimit,
      });
    } else if (selectedBudgetSummary) {
      form.reset({
        name: selectedBudgetSummary.name,
        type: selectedBudgetSummary.type,
        ownerMemberId: selectedBudgetSummary.ownerMemberId ?? "",
        categoryIds: selectedBudgetSummary.categories.map(
          (category) => category.id,
        ),
        monthlyLimit: selectedBudgetSummary.monthlyLimit,
      });
    }
  }, [form, isCreating, selectedBudget, selectedBudgetSummary]);

  async function onSubmit(values: BudgetFormValues) {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        await createBudget(mapFormValuesToPayload(values), accessToken);
        handleCloseDrawer();
        await loadBudgetsData({
          referenceMonth,
          page,
          size: pageSize,
          search,
          status: statusFilter,
          type: typeFilter || undefined,
        });
      } else if (selectedBudgetSummary) {
        await updateBudget(
          selectedBudgetSummary.id,
          mapFormValuesToPayload(values),
          accessToken,
        );
        handleCloseDrawer();
        await loadBudgetsData({
          referenceMonth,
          page,
          size: pageSize,
          search,
          status: statusFilter,
          type: typeFilter || undefined,
        });
      }
    } catch {
      setError(t("budgets.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function onArchive() {
    if (
      !accessToken ||
      !selectedBudgetSummary ||
      selectedBudgetSummary.archivedFromMonth
    ) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      const archived = await archiveBudget(
        selectedBudgetSummary.id,
        referenceMonth,
        accessToken,
      );
      setSelectedId(archived.id);
      await loadBudgetsData({
        referenceMonth,
        page,
        size: pageSize,
        search,
        status: statusFilter,
        type: typeFilter || undefined,
      });
    } catch {
      setError(t("budgets.archiveError"));
    } finally {
      setIsArchiving(false);
    }
  }

  function handleStartCreate() {
    setIsCreating(true);
    setSelectedId(null);
    setSelectedBudget(null);
    setCategoryBreakdown([]);
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
    setSelectedBudget(null);
    setCategoryBreakdown([]);
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
              label: `${t("common.type")}: ${t(`budgetTypes.${typeFilter}`)}`,
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
      title={t("budgets.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("budgets.new")}
        </Button>
      }
    >
      {showInitialLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label={t("budgets.loading")} />
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
                <>
                  <Field
                    htmlFor="budget-reference-month"
                    label={t("common.month")}
                  >
                    <MonthSelector
                      id="budget-reference-month"
                      onChange={(newMonth) => {
                        setReferenceMonth(newMonth);
                        setPage(0);
                      }}
                      value={referenceMonth}
                    />
                  </Field>
                  <Field htmlFor="budget-search" label={t("common.search")}>                     <Input
                      id="budget-search"
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(0);
                      }}
                      placeholder={t("budgets.searchPlaceholder")}
                      value={search}
                    />
                  </Field>
                </>
              }
              secondaryContent={
                <>
                  <Field
                    htmlFor="budget-status-filter"
                    label={t("common.status")}
                  >
                    <Select
                      id="budget-status-filter"
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

                  <Field htmlFor="budget-type-filter" label={t("common.type")}>
                    <Select
                      id="budget-type-filter"
                      onChange={(event) => {
                        setTypeFilter(event.target.value as "" | BudgetType);
                        setPage(0);
                      }}
                      value={typeFilter}
                    >
                      <option value="">{t("common.allTypes")}</option>
                      <option value="GLOBAL">{t("budgetTypes.GLOBAL")}</option>
                      <option value="ALLOWANCE">
                        {t("budgetTypes.ALLOWANCE")}
                      </option>
                    </Select>
                  </Field>
                </>
              }
            />
          </Card>

          <section className={styles.budgetGrid}>
            {budgets.length === 0 ? (
              <Card className={styles.emptyState}>
                <p>{t("budgets.empty")}</p>
              </Card>
            ) : (
              budgets.map((budget) => (
                <Card key={budget.id} className={styles.budgetCard}>
                  <button
                    className={styles.budgetButton}
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedId(budget.id);
                      setError(null);
                    }}
                    type="button"
                  >
                    <div className={styles.budgetHeader}>
                      <div>
                        <strong>{budget.name}</strong>
                        <p className={styles.budgetMeta}>
                          {budget.type === "ALLOWANCE" && budget.ownerMemberName
                            ? t("budgets.allowanceFor", {
                                name: budget.ownerMemberName,
                              })
                            : t("budgets.linkedCategories", {
                                count: budget.categories.length,
                              })}
                        </p>
                      </div>
                      <div className={styles.budgetAmounts}>
                        <strong>{formatCurrency(budget.monthlyLimit)}</strong>
                        <p className={styles.budgetMeta}>
                          {t("budgets.consumed")}{" "}
                          <MoneyAmount amount={budget.consumedAmount} type="EXPENSE" />
                        </p>
                      </div>
                    </div>

                    <div className={styles.badgeRow}>
                      <span className={styles.badge}>
                        {t(`budgetTypes.${budget.type}` as const)}
                      </span>
                      <span
                        className={
                          budget.archivedFromMonth
                            ? `${styles.badge} ${styles.badgeMuted}`
                            : `${styles.badge} ${styles.badgeSuccess}`
                        }
                      >
                        {budget.archivedFromMonth
                          ? t("budgets.archivedFrom", {
                              month: formatReferenceMonth(
                                budget.archivedFromMonth,
                              ),
                            })
                          : t("common.active")}
                      </span>
                    </div>
                  </button>
                </Card>
              ))
            )}
          </section>

          <PaginationBar
            start={rangeStart}
            end={rangeEnd}
            total={totalItems}
            pageSize={pageSize}
            hasPrevious={hasPreviousPage}
            hasNext={hasNextPage}
            onPrevious={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(0);
            }}
          />

          {isCreating || selectedBudgetSummary ? (
            <Drawer
              description={
                isCreating
                  ? t("budgets.newDescription")
                  : t("budgets.editDescription", {
                      month: formatReferenceMonth(referenceMonth),
                    })
              }
              onClose={handleCloseDrawer}
              title={
                isCreating ? t("budgets.newTitle") : t("budgets.detailsTitle")
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
                    htmlFor="budget-name"
                    label={t("common.name")}
                  >
                    <Input
                      id="budget-name"
                      hasError={Boolean(form.formState.errors.name)}
                      {...form.register("name")}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.type?.message}
                    htmlFor="budget-type"
                    label={t("common.type")}
                  >
                    <Select
                      id="budget-type"
                      hasError={Boolean(form.formState.errors.type)}
                      {...form.register("type")}
                    >
                      <option value="GLOBAL">{t("budgetTypes.GLOBAL")}</option>
                      <option value="ALLOWANCE">
                        {t("budgetTypes.ALLOWANCE")}
                      </option>
                    </Select>
                  </Field>

                  <Field
                    error={form.formState.errors.monthlyLimit?.message}
                    htmlFor="budget-monthly-limit"
                    label={t("budgets.monthlyLimit")}
                  >
                    <Controller
                      control={form.control}
                      name="monthlyLimit"
                      render={({ field }) => (
                        <CurrencyInput
                          hasError={Boolean(form.formState.errors.monthlyLimit)}
                          id="budget-monthly-limit"
                          onBlur={field.onBlur}
                          onValueChange={field.onChange}
                          ref={field.ref}
                          value={field.value}
                        />
                      )}
                    />
                  </Field>

                  {budgetType === "ALLOWANCE" ? (
                    <Field
                      error={form.formState.errors.ownerMemberId?.message}
                      htmlFor="budget-owner-member"
                      label={t("budgets.ownerMember")}
                    >
                      <Select
                        id="budget-owner-member"
                        hasError={Boolean(form.formState.errors.ownerMemberId)}
                        {...form.register("ownerMemberId")}
                      >
                        <option value="">{t("common.selectMember")}</option>
                        {availableAllowanceMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  ) : (
                    <Field
                      error={form.formState.errors.categoryIds?.message}
                      htmlFor="budget-linked-categories"
                      label={t("budgets.linkedCategoriesTitle")}
                    >
                      <Controller
                        control={form.control}
                        name="categoryIds"
                        render={({ field }) => (
                          <CategoryMultiSelect
                            hasError={Boolean(
                              form.formState.errors.categoryIds,
                            )}
                            id="budget-linked-categories"
                            onChange={field.onChange}
                            options={categoryOptions}
                            placeholder={t("common.selectCategories")}
                            value={field.value}
                          />
                        )}
                      />
                      <p className={styles.helperText}>
                        {t("budgets.globalHelper")}
                      </p>
                    </Field>
                  )}

                  <FormError>{error}</FormError>

                  <div className={styles.formActions}>
                    <Button loading={isSaving} type="submit">
                      {isCreating
                        ? t("budgets.create")
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
                        disabled={Boolean(
                          selectedBudgetSummary?.archivedFromMonth,
                        )}
                        onClick={() => setIsArchiveConfirmOpen(true)}
                        type="button"
                        variant={
                          selectedBudgetSummary?.archivedFromMonth
                            ? "subtle"
                            : "danger"
                        }
                      >
                        {selectedBudgetSummary?.archivedFromMonth
                          ? t("budgets.archived")
                          : t("common.archive")}
                      </Button>
                    )}
                  </div>
                </form>

                {!isCreating ? (
                  <Card className={styles.detailPanel}>
                    <div className={styles.detailHeader}>
                      <h3 className={styles.detailTitle}>
                        {t("budgets.currentImpact")}
                      </h3>
                      <p className={styles.detailSubtitle}>
                        {t("budgets.currentImpactSubtitle", {
                          month: formatReferenceMonth(referenceMonth),
                        })}
                      </p>
                    </div>

                    {isDetailLoading ? (
                      <Spinner label={t("budgets.loadingDetails")} />
                    ) : selectedBudget ? (
                      <div className={styles.detailSection}>
                        <section className={styles.summaryGrid}>
                          <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>
                              {t("budgets.limit")}
                            </span>
                            <strong className={styles.summaryValue}>
                              {formatCurrency(selectedBudget.monthlyLimit)}
                            </strong>
                          </div>
                          <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>
                              {t("budgets.consumed")}
                            </span>
                            <strong className={styles.summaryValue}>
                              {formatCurrency(selectedBudget.consumedAmount)}
                            </strong>
                          </div>
                          <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>
                              {t("budgets.remaining")}
                            </span>
                            <strong className={styles.summaryValue}>
                              {formatCurrency(selectedBudget.remainingAmount)}
                            </strong>
                          </div>
                        </section>

                        <section className={styles.sectionBlock}>
                          <h4 className={styles.sectionTitle}>
                            {t("budgets.categoryBreakdown")}
                          </h4>
                          {categoryBreakdown.length > 0 ? (
                            <div className={styles.detailList}>
                              {categoryBreakdown.map((item) => (
                                <div
                                  key={item.categoryId}
                                  className={styles.detailRow}
                                >
                                  <strong>{item.categoryName}</strong>
                                  <strong>{formatCurrency(item.amount)}</strong>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={styles.emptyStateInline}>
                              {t("budgets.noCategoryConsumption")}
                            </div>
                          )}
                        </section>

                        <section className={styles.sectionBlock}>
                          <h4 className={styles.sectionTitle}>
                            {t("budgets.matchedTransactions")}
                          </h4>
                          {selectedBudget.transactions.length > 0 ? (
                            <div className={styles.transactionList}>
                              {selectedBudget.transactions.map(
                                (transaction) => (
                                  <div
                                    key={transaction.id}
                                    className={styles.transactionRow}
                                  >
                                    <div>
                                      <strong>{transaction.description}</strong>
                                      <p className={styles.itemMeta}>
                                        {transaction.categoryName} ·{" "}
                                        {transaction.accountName} ·{" "}
                                        {formatDay(transaction.transactionDate)}
                                      </p>
                                    </div>
                                    <strong>
                                      {formatCurrency(transaction.amount)}
                                    </strong>
                                  </div>
                                ),
                              )}
                            </div>
                          ) : (
                            <div className={styles.emptyStateInline}>
                              {t("budgets.noMatchedTransactions")}
                            </div>
                          )}
                        </section>

                        <section className={styles.sectionBlock}>
                          <h4 className={styles.sectionTitle}>
                            {t("budgets.linkedCategoriesTitle")}
                          </h4>
                          {selectedBudget.categories.length > 0 ? (
                            <div className={styles.categoryList}>
                              {selectedBudget.categories.map((category) => (
                                <span
                                  key={category.id}
                                  className={styles.badge}
                                >
                                  {category.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className={styles.emptyStateInline}>
                              {t("budgets.noSharedCategories")}
                            </div>
                          )}
                        </section>
                      </div>
                    ) : (
                      <p className={styles.detailSubtitle}>
                        {t("budgets.selectToReview")}
                      </p>
                    )}
                  </Card>
                ) : null}
              </div>

              <ConfirmAction
                confirmLabel={t("common.archive")}
                loading={isArchiving}
                message={t("confirmations.archiveBudget")}
                onCancel={() => setIsArchiveConfirmOpen(false)}
                onConfirm={() => {
                  setIsArchiveConfirmOpen(false);
                  void onArchive();
                }}
                open={isArchiveConfirmOpen}
                title={t("budgets.archiveTitle")}
              />
            </Drawer>
          ) : null}
        </section>
      )}
    </AppShell>
  );
}
