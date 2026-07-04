import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BaseSyntheticEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { listAccounts, type Account } from "../../app/api/accounts";
import {
  listCategoryOptions,
  type CategoryOption,
} from "../../app/api/categories";
import { listFamilyMembers, type FamilyMember } from "../../app/api/family";
import {
  createTransaction,
  deleteTransaction,
  listTransactionDescriptionSuggestions,
  listTransactions,
  updateTransaction,
  type DeleteScope,
  type OwnershipType,
  type Transaction,
  type TransactionFilters,
  type TransactionPayload,
  type TransactionType,
} from "../../app/api/transactions";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import CategorySelect from "../../components/ui/CategorySelect";
import Drawer from "../../components/ui/Drawer";
import CurrencyInput from "../../components/ui/CurrencyInput";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Switch from "../../components/ui/Switch";
import { useI18n } from "../../app/i18n/I18nContext";
import { getStoredIcon } from "../../lib/icons";
import { formatCurrency } from "../../lib/formatters/currency";
import {
  formatDay,
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import {
  transactionSchema,
  type TransactionFormValues,
} from "../../lib/validation/transactionSchema";
import styles from "./TransactionsPage.module.scss";

const DEFAULT_PAGE_SIZE = 12;

function toMonthInputValue(value: string) {
  return value.slice(0, 7);
}

function fromMonthInputValue(value: string) {
  return `${value}-01`;
}

function referenceMonthFromDate(value: string) {
  return `${value.slice(0, 7)}-01`;
}

function createDefaultValues(referenceMonth: string): TransactionFormValues {
  return {
    type: "EXPENSE",
    ownershipType: "SHARED",
    description: "",
    amount: 0,
    transactionDate: referenceMonth,
    accountId: "",
    categoryId: "",
    memberId: "",
    isInstallment: false,
    installmentCount: 2,
  };
}

function mapFormValuesToCreatePayload(
  values: TransactionFormValues,
): TransactionPayload {
  return {
    type: values.type,
    ownershipType: values.ownershipType,
    description: values.description,
    amount: values.amount,
    transactionDate: values.transactionDate,
    accountId: values.accountId,
    categoryId: values.categoryId,
    memberId:
      values.ownershipType === "INDIVIDUAL" ? values.memberId : undefined,
    installmentCount:
      values.type === "EXPENSE" && values.isInstallment
        ? values.installmentCount
        : undefined,
  };
}

function mapFormValuesToUpdatePayload(
  values: TransactionFormValues,
): Omit<TransactionPayload, "installmentCount"> {
  return {
    type: values.type,
    ownershipType: values.ownershipType,
    description: values.description,
    amount: values.amount,
    transactionDate: values.transactionDate,
    accountId: values.accountId,
    categoryId: values.categoryId,
    memberId:
      values.ownershipType === "INDIVIDUAL" ? values.memberId : undefined,
  };
}

export default function TransactionsPage() {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const initialReferenceMonth = useMemo(() => getCurrentReferenceMonth(), []);
  const descriptionInputRef = useRef<HTMLInputElement | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteScope, setDeleteScope] = useState<DeleteScope>("SINGLE");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<TransactionFilters>({
    referenceMonth: initialReferenceMonth,
  });

  const selectedTransaction = useMemo(
    () =>
      transactions.find((transaction) => transaction.id === selectedId) ?? null,
    [selectedId, transactions],
  );

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: createDefaultValues(initialReferenceMonth),
  });

  const transactionType = form.watch("type");
  const ownershipType = form.watch("ownershipType");
  const descriptionValue = form.watch("description");
  const transactionDate = form.watch("transactionDate");
  const isInstallment = form.watch("isInstallment");
  const currentReferenceMonth = useMemo(
    () => referenceMonthFromDate(transactionDate || filters.referenceMonth),
    [filters.referenceMonth, transactionDate],
  );
  const allowanceMembers = useMemo(
    () => members.filter((member) => member.active && member.allowanceEnabled),
    [members],
  );
  const categoryOptionsById = useMemo(
    () => new Map(categoryOptions.map((category) => [category.id, category])),
    [categoryOptions],
  );

  const focusDescriptionField = useCallback(() => {
    window.setTimeout(() => {
      descriptionInputRef.current?.focus();
    }, 0);
  }, []);

  const loadPageData = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [
        transactionsResponse,
        accountsResponse,
        categoriesResponse,
        membersResponse,
      ] = await Promise.all([
        listTransactions({ ...filters, page, size: pageSize }, accessToken),
        listAccounts(accessToken),
        listCategoryOptions(filters.referenceMonth, accessToken),
        listFamilyMembers(accessToken),
      ]);

      setTransactions(transactionsResponse.items);
      setPage(transactionsResponse.page);
      setPageSize(transactionsResponse.size);
      setTotalItems(transactionsResponse.totalItems);
      setTotalPages(transactionsResponse.totalPages);
      setAccounts(accountsResponse);
      setCategoryOptions(categoriesResponse);
      setMembers(membersResponse);
      setSelectedId((current) =>
        current &&
        transactionsResponse.items.some(
          (transaction) => transaction.id === current,
        )
          ? current
          : null,
      );
    } catch {
      setError(t("transactions.error"));
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  }, [accessToken, filters, page, pageSize, t]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (isCreating) {
      form.reset(createDefaultValues(filters.referenceMonth));
      focusDescriptionField();
      return;
    }

    if (selectedTransaction) {
      form.reset({
        type: selectedTransaction.type,
        ownershipType: selectedTransaction.ownershipType,
        description: selectedTransaction.description,
        amount: selectedTransaction.amount,
        transactionDate: selectedTransaction.transactionDate,
        accountId: selectedTransaction.accountId,
        categoryId: selectedTransaction.categoryId,
        memberId: selectedTransaction.memberId ?? "",
        isInstallment: Boolean(selectedTransaction.installmentTotal),
        installmentCount: selectedTransaction.installmentTotal ?? 2,
      });
      setDeleteScope("SINGLE");
    }
  }, [filters.referenceMonth, focusDescriptionField, form, isCreating, selectedTransaction]);

  useEffect(() => {
    if (currentReferenceMonth === filters.referenceMonth) {
      return;
    }

    if (!accessToken) {
      return;
    }

    const updateCategories = async () => {
      try {
        const response = await listCategoryOptions(
          currentReferenceMonth,
          accessToken,
        );
        setCategoryOptions(response);
      } catch {
        setError(t("transactions.categoryRefreshError"));
      }
    };

    void updateCategories();
  }, [accessToken, currentReferenceMonth, filters.referenceMonth, t]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const normalizedQuery = descriptionValue.trim();
    if (normalizedQuery.length < 2) {
      setDescriptionSuggestions([]);
      return;
    }

    let isActive = true;

    const loadSuggestions = async () => {
      try {
        const suggestions = await listTransactionDescriptionSuggestions(
          normalizedQuery,
          accessToken,
        );
        if (!isActive) {
          return;
        }
        setDescriptionSuggestions(suggestions);
      } catch {
        if (!isActive) {
          return;
        }
        setDescriptionSuggestions([]);
      }
    };

    void loadSuggestions();

    return () => {
      isActive = false;
    };
  }, [accessToken, descriptionValue]);

  function resetForNextCreate(values: TransactionFormValues) {
    form.reset({
      type: values.type,
      ownershipType: values.ownershipType,
      description: "",
      amount: 0,
      transactionDate: values.transactionDate,
      accountId: values.accountId,
      categoryId: values.categoryId,
      memberId: values.ownershipType === "INDIVIDUAL" ? values.memberId : "",
      isInstallment: values.type === "EXPENSE" ? values.isInstallment : false,
      installmentCount: values.isInstallment ? values.installmentCount ?? 2 : 2,
    });
    setSelectedId(null);
    focusDescriptionField();
  }

  async function onSubmit(
    values: TransactionFormValues,
    event?: BaseSyntheticEvent,
  ) {
    if (!accessToken) {
      return;
    }

    const nativeEvent = event?.nativeEvent as SubmitEvent | undefined;
    const submitter = nativeEvent?.submitter as HTMLButtonElement | undefined;
    const intent = submitter?.value === "save-and-create-new"
      ? "save-and-create-new"
      : "save";

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        const created = await createTransaction(
          mapFormValuesToCreatePayload(values),
          accessToken,
        );

        await loadPageData();

        if (intent === "save-and-create-new") {
          resetForNextCreate(values);
        } else {
          if (created[0]) {
            setSelectedId(created[0].id);
          }
          setIsCreating(false);
        }
      } else if (selectedTransaction) {
        const updated = await updateTransaction(
          selectedTransaction.id,
          mapFormValuesToUpdatePayload(values),
          accessToken,
        );
        setSelectedId(updated.id);
        await loadPageData();
      }
    } catch {
      setError(t("transactions.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!accessToken || !selectedTransaction) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteTransaction(selectedTransaction.id, deleteScope, accessToken);
      setSelectedId(null);
      await loadPageData();
    } catch {
      setError(t("transactions.deleteError"));
    } finally {
      setIsDeleting(false);
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
  const supportsGroupedDelete = Boolean(
    selectedTransaction?.installmentGroupId,
  );
  const rangeStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const rangeEnd =
    totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);
  const hasPreviousPage = page > 0;
  const hasNextPage = page + 1 < totalPages;

  return (
    <AppShell
      title={t("transactions.title")}
      subtitle={t("transactions.subtitle")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("transactions.new")}
        </Button>
      }
    >
      {showInitialLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label={t("transactions.loading")} />
        </Card>
      ) : (
        <section className={styles.stack}>
          <Card className={styles.toolbarPanel}>
            <div className={styles.filtersGrid}>
              <Field
                label={t("common.referenceMonth")}
                htmlFor="transaction-filter-month"
              >
                <Input
                  id="transaction-filter-month"
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      referenceMonth: fromMonthInputValue(event.target.value),
                    }));
                    setPage(0);
                  }}
                  type="month"
                  value={toMonthInputValue(filters.referenceMonth)}
                />
              </Field>

              <Field label={t("common.type")} htmlFor="transaction-filter-type">
                <Select
                  id="transaction-filter-type"
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      type:
                        event.target.value.length > 0
                          ? (event.target.value as TransactionType)
                          : undefined,
                    }));
                    setPage(0);
                  }}
                  value={filters.type ?? ""}
                >
                  <option value="">{t("common.allTypes")}</option>
                  <option value="INCOME">{t("transactionTypes.INCOME")}</option>
                  <option value="EXPENSE">
                    {t("transactionTypes.EXPENSE")}
                  </option>
                </Select>
              </Field>

              <Field
                label={t("common.ownership")}
                htmlFor="transaction-filter-ownership"
              >
                <Select
                  id="transaction-filter-ownership"
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      ownershipType:
                        event.target.value.length > 0
                          ? (event.target.value as OwnershipType)
                          : undefined,
                    }));
                    setPage(0);
                  }}
                  value={filters.ownershipType ?? ""}
                >
                  <option value="">{t("common.allOwnerships")}</option>
                  <option value="SHARED">{t("ownershipTypes.SHARED")}</option>
                  <option value="INDIVIDUAL">
                    {t("ownershipTypes.INDIVIDUAL")}
                  </option>
                </Select>
              </Field>

              <Field
                label={t("common.account")}
                htmlFor="transaction-filter-account"
              >
                <Select
                  id="transaction-filter-account"
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      accountId: event.target.value || undefined,
                    }));
                    setPage(0);
                  }}
                  value={filters.accountId ?? ""}
                >
                  <option value="">{t("common.allAccounts")}</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label={t("common.category")}
                htmlFor="transaction-filter-category"
              >
                <CategorySelect
                  id="transaction-filter-category"
                  onChange={(value) => {
                    setFilters((current) => ({
                      ...current,
                      categoryId: value || undefined,
                    }));
                    setPage(0);
                  }}
                  options={categoryOptions}
                  placeholder={t("common.allCategories")}
                  value={filters.categoryId ?? ""}
                />
              </Field>

              <Field
                label={t("common.member")}
                htmlFor="transaction-filter-member"
              >
                <Select
                  id="transaction-filter-member"
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      memberId: event.target.value || undefined,
                    }));
                    setPage(0);
                  }}
                  value={filters.memberId ?? ""}
                >
                  <option value="">{t("common.allMembers")}</option>
                  {allowanceMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          <section className={styles.transactionGrid}>
            {transactions.length === 0 ? (
              <Card className={styles.emptyState}>
                <p>{t("transactions.empty")}</p>
              </Card>
            ) : (
              transactions.map((transaction) => {
                const categoryOption = categoryOptionsById.get(
                  transaction.categoryId,
                );
                const CategoryIcon = getStoredIcon(categoryOption?.icon);
                const categoryColor = categoryOption?.color ?? undefined;

                return (
                  <Card key={transaction.id} className={styles.transactionCard}>
                    <button
                      className={styles.transactionButton}
                      onClick={() => {
                        setIsCreating(false);
                        setSelectedId(transaction.id);
                        setError(null);
                      }}
                      style={
                        categoryColor
                          ? { borderInlineStartColor: categoryColor }
                          : undefined
                      }
                      type="button"
                    >
                      <div className={styles.transactionTop}>
                        <div className={styles.transactionMain}>
                          <div className={styles.transactionTitleRow}>
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
                            <div className={styles.transactionLine}>
                              <strong className={styles.transactionDescription}>
                                {transaction.description}
                              </strong>
                              <span className={styles.transactionMetaSeparator}>
                                ·
                              </span>
                              <span className={styles.transactionMeta}>
                                {transaction.categoryName} · {transaction.accountName} · {formatDay(transaction.transactionDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <strong className={styles.transactionAmount}>
                          {formatCurrency(transaction.amount)}
                        </strong>
                      </div>

                      <div className={styles.badgeRow}>
                        <span
                          className={`${styles.badge} ${transaction.type === "INCOME" ? styles.badgeIncome : styles.badgeExpense}`}
                        >
                          {t(`transactionTypes.${transaction.type}` as const)}
                        </span>
                        <span className={styles.badge}>
                          {t(
                            `ownershipTypes.${transaction.ownershipType}` as const,
                          )}
                        </span>
                        {transaction.memberName ? (
                          <span
                            className={`${styles.badge} ${styles.badgeMuted}`}
                          >
                            {transaction.memberName}
                          </span>
                        ) : null}
                        {transaction.installmentTotal ? (
                          <span
                            className={`${styles.badge} ${styles.badgeMuted}`}
                          >
                            {transaction.installmentNumber}/
                            {transaction.installmentTotal}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  </Card>
                );
              })
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
                    variant="secondary"
                  >
                    {t("common.previous")}
                  </Button>
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

          {isCreating || selectedTransaction ? (
            <Drawer
              description={
                isCreating
                  ? t("transactions.newDescription")
                  : t("transactions.editDescription", {
                      month: formatReferenceMonth(filters.referenceMonth),
                    })
              }
              onClose={handleCloseDrawer}
              title={
                isCreating
                  ? t("transactions.newTitle")
                  : t("transactions.detailsTitle")
              }
            >
              <div className={styles.drawerStack}>
                <form
                  className={styles.form}
                  onSubmit={form.handleSubmit(onSubmit)}
                  noValidate
                >
                  <Field
                    error={form.formState.errors.description?.message}
                    htmlFor="transaction-description"
                    label={t("transactions.description")}
                  >
                    <>
                      <Input
                        id="transaction-description"
                        autoComplete="off"
                        hasError={Boolean(form.formState.errors.description)}
                        list="transaction-description-suggestions"
                        {...form.register("description")}
                        ref={(element) => {
                          form.register("description").ref(element);
                          descriptionInputRef.current = element;
                        }}
                      />
                      <datalist
                        data-testid="transaction-description-suggestions"
                        id="transaction-description-suggestions"
                      >
                        {descriptionSuggestions.map((suggestion) => (
                          <option key={suggestion} value={suggestion}>
                            {suggestion}
                          </option>
                        ))}
                      </datalist>
                    </>
                  </Field>

                  <Field
                    error={form.formState.errors.amount?.message}
                    htmlFor="transaction-amount"
                    label={t("transactions.amount")}
                  >
                    <Controller
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <CurrencyInput
                          hasError={Boolean(form.formState.errors.amount)}
                          id="transaction-amount"
                          onBlur={field.onBlur}
                          onValueChange={field.onChange}
                          ref={field.ref}
                          value={field.value}
                        />
                      )}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.transactionDate?.message}
                    htmlFor="transaction-date"
                    label={t("transactions.transactionDate")}
                  >
                    <Input
                      id="transaction-date"
                      hasError={Boolean(form.formState.errors.transactionDate)}
                      type="date"
                      {...form.register("transactionDate")}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.type?.message}
                    htmlFor="transaction-type-expense"
                    label={t("common.type")}
                  >
                    <Controller
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <div
                          aria-label={t("common.type")}
                          className={styles.segmentedControl}
                          role="radiogroup"
                        >
                          {(["EXPENSE", "INCOME"] as const).map((typeOption) => {
                            const toneClass =
                              typeOption === "INCOME"
                                ? styles.segmentButtonIncome
                                : styles.segmentButtonExpense;
                            const activeClass =
                              field.value === typeOption
                                ? typeOption === "INCOME"
                                  ? styles.segmentButtonIncomeActive
                                  : styles.segmentButtonExpenseActive
                                : "";

                            return (
                              <button
                                aria-checked={field.value === typeOption}
                                className={`${styles.segmentButton} ${toneClass} ${activeClass}`.trim()}
                                id={`transaction-type-${typeOption.toLowerCase()}`}
                                key={typeOption}
                                onBlur={field.onBlur}
                                onClick={() => field.onChange(typeOption)}
                                role="radio"
                                type="button"
                              >
                                {t(`transactionTypes.${typeOption}` as const)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    />
                  </Field>

                  <div className={styles.switchGrid}>
                    <Field htmlFor="transaction-ownership-switch" label={t("common.ownership")}>
                      <Controller
                        control={form.control}
                        name="ownershipType"
                        render={({ field }) => (
                          <Switch
                            checked={field.value === "INDIVIDUAL"}
                            id="transaction-ownership-switch"
                            label={t("ownershipTypes.INDIVIDUAL")}
                            onBlur={field.onBlur}
                            onChange={(event) =>
                              field.onChange(
                                event.target.checked ? "INDIVIDUAL" : "SHARED",
                              )
                            }
                            ref={field.ref}
                          />
                        )}
                      />
                    </Field>

                    {isCreating && transactionType === "EXPENSE" ? (
                      <Field
                        htmlFor="transaction-installment-switch"
                        label={t("transactions.installmentToggle")}
                      >
                        <Controller
                          control={form.control}
                          name="isInstallment"
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              id="transaction-installment-switch"
                              label={t("transactions.installmentToggle")}
                              onBlur={field.onBlur}
                              onChange={(event) =>
                                field.onChange(event.target.checked)
                              }
                              ref={field.ref}
                            />
                          )}
                        />
                      </Field>
                    ) : null}
                  </div>

                  <Field
                    error={form.formState.errors.accountId?.message}
                    htmlFor="transaction-account"
                    label={t("common.account")}
                  >
                    <Select
                      id="transaction-account"
                      hasError={Boolean(form.formState.errors.accountId)}
                      {...form.register("accountId")}
                    >
                      <option value="">{t("common.selectAccount")}</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field
                    error={form.formState.errors.categoryId?.message}
                    htmlFor="transaction-category"
                    label={t("common.category")}
                  >
                    <Controller
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <CategorySelect
                          hasError={Boolean(form.formState.errors.categoryId)}
                          id="transaction-category"
                          onChange={field.onChange}
                          options={categoryOptions}
                          placeholder={t("common.selectCategory")}
                          value={field.value}
                        />
                      )}
                    />
                  </Field>

                  {ownershipType === "INDIVIDUAL" ? (
                    <Field
                      error={form.formState.errors.memberId?.message}
                      htmlFor="transaction-member"
                      label={t("common.member")}
                    >
                      <Select
                        id="transaction-member"
                        hasError={Boolean(form.formState.errors.memberId)}
                        {...form.register("memberId")}
                      >
                        <option value="">{t("common.selectMember")}</option>
                        {allowanceMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  ) : null}

                  {isCreating && transactionType === "EXPENSE" && isInstallment ? (
                    <Field
                      error={form.formState.errors.installmentCount?.message}
                      htmlFor="transaction-installment-count"
                      label={t("transactions.installmentCount")}
                    >
                      <Input
                        id="transaction-installment-count"
                        hasError={Boolean(
                          form.formState.errors.installmentCount,
                        )}
                        max="120"
                        min="2"
                        step="1"
                        type="number"
                        {...form.register("installmentCount")}
                      />
                    </Field>
                  ) : null}

                  <FormError>{error}</FormError>

                  <div className={styles.formActions}>
                    {isCreating ? (
                      <>
                        <Button
                          loading={isSaving}
                          type="submit"
                          value="save-and-create-new"
                        >
                          {t("transactions.saveAndCreateNew")}
                        </Button>
                        <Button
                          loading={isSaving}
                          type="submit"
                          value="save"
                          variant="secondary"
                        >
                          {t("transactions.save")}
                        </Button>
                        <Button
                          onClick={handleCancelCreate}
                          type="button"
                          variant="secondary"
                        >
                          {t("common.cancel")}
                        </Button>
                      </>
                    ) : (
                      <Button loading={isSaving} type="submit">
                        {t("common.saveChanges")}
                      </Button>
                    )}
                  </div>
                </form>

                {!isCreating && selectedTransaction ? (
                  <Card className={styles.deletePanel}>
                    <div className={styles.deleteHeader}>
                      <h3 className={styles.deleteTitle}>
                        {t("transactions.deleteTitle")}
                      </h3>
                      <p className={styles.helperText}>
                        {t("transactions.deleteSubtitle")}
                      </p>
                    </div>

                    <div className={styles.deleteSection}>
                      {supportsGroupedDelete ? (
                        <Field
                          htmlFor="transaction-delete-scope"
                          label={t("transactions.deleteScope")}
                        >
                          <Select
                            id="transaction-delete-scope"
                            onChange={(event) =>
                              setDeleteScope(event.target.value as DeleteScope)
                            }
                            value={deleteScope}
                          >
                            <option value="SINGLE">
                              {t("transactions.deleteScope.single")}
                            </option>
                            <option value="FUTURE">
                              {t("transactions.deleteScope.future")}
                            </option>
                            <option value="ALL">
                              {t("transactions.deleteScope.all")}
                            </option>
                          </Select>
                        </Field>
                      ) : (
                        <p className={styles.helperText}>
                          {t("transactions.noInstallmentGroup")}
                        </p>
                      )}

                      <Button
                        loading={isDeleting}
                        onClick={() => void handleDelete()}
                        type="button"
                        variant="secondary"
                      >
                        {t("transactions.deleteAction")}
                      </Button>
                    </div>
                  </Card>
                ) : null}
              </div>
            </Drawer>
          ) : null}
        </section>
      )}
    </AppShell>
  );
}
