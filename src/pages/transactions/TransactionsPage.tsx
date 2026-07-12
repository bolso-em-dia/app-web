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
  materializeTransactions,
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
import ConfirmAction from "../../components/ui/ConfirmAction";
import CategoryMultiSelect from "../../components/ui/CategoryMultiSelect";
import CategorySelect from "../../components/ui/CategorySelect";
import Drawer from "../../components/ui/Drawer";
import MonthSelector from "../../components/ui/MonthSelector";
import CurrencyInput from "../../components/ui/CurrencyInput";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Switch from "../../components/ui/Switch";
import { useI18n } from "../../app/i18n/I18nContext";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";
import { getStoredIcon } from "../../lib/icons";
import MoneyAmount from "../../components/ui/MoneyAmount";
import PaginationBar from "../../components/ui/PaginationBar";
import { formatCurrency } from "../../lib/formatters/currency";
import {
  formatDay,
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import {
  createTransactionSchema,
  type TransactionFormValues,
} from "../../lib/validation/transactionSchema";
import styles from "./TransactionsPage.module.scss";


type Translate = ReturnType<typeof useI18n>["t"];

function referenceMonthFromDate(value: string) {
  return `${value.slice(0, 7)}-01`;
}

function createDefaultValues(
  referenceMonth: string,
  defaultAccountId: string,
): TransactionFormValues {
  return {
    type: "EXPENSE",
    ownershipType: "SHARED",
    description: "",
    amount: 0,
    transactionDate: referenceMonth,
    accountId: defaultAccountId,
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

function formatCategoryFilterLabel(
  selectedCategories: CategoryOption[],
  t: Translate,
) {
  if (selectedCategories.length === 0) {
    return "";
  }

  const labelPrefix = `${t("common.categories")}: `;

  if (selectedCategories.length === 1) {
    return `${labelPrefix}${selectedCategories[0].name}`;
  }

  if (selectedCategories.length === 2) {
    return `${labelPrefix}${selectedCategories[0].name}, ${selectedCategories[1].name}`;
  }

  return `${labelPrefix}${selectedCategories[0].name} +${selectedCategories.length - 1}`;
}

export default function TransactionsPage() {
  const { accessToken, user } = useAuth();
  const { t } = useI18n();
  const initialReferenceMonth = useMemo(() => getCurrentReferenceMonth(), []);
  const descriptionInputRef = useRef<HTMLInputElement | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<
    string[]
  >([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState<DeleteScope>("SINGLE");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    referenceMonth: initialReferenceMonth,
  });

  const selectedTransaction = useMemo(
    () =>
      transactions.find((transaction) => transaction.id === selectedId) ?? null,
    [selectedId, transactions],
  );

  const transactionSchema = useMemo(() => createTransactionSchema(t), [t]);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: createDefaultValues(
      initialReferenceMonth,
      user?.preferences.defaultAccountId ?? "",
    ),
  });

  const transactionType = form.watch("type");
  const ownershipType = form.watch("ownershipType");
  const descriptionValue = form.watch("description");
  const transactionDate = form.watch("transactionDate");
  const isInstallment = form.watch("isInstallment");
  const formAccountId = form.watch("accountId");
  const selectedAccountCurrency = useMemo(
    () => accounts.find((a) => a.id === formAccountId)?.currency as "BRL" | "USD" | undefined,
    [accounts, formAccountId],
  );
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
      // Materialize fixed expenses for this month before listing
      await materializeTransactions(filters.referenceMonth, accessToken);

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
      installmentCount: values.isInstallment
        ? (values.installmentCount ?? 2)
        : 2,
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
    const intent =
      submitter?.value === "save-and-create-new"
        ? "save-and-create-new"
        : "save";

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        await createTransaction(mapFormValuesToCreatePayload(values), accessToken);

        await loadPageData();

        if (intent === "save-and-create-new") {
          resetForNextCreate(values);
        } else {
          handleCloseDrawer();
        }
      } else if (selectedTransaction) {
        await updateTransaction(
          selectedTransaction.id,
          mapFormValuesToUpdatePayload(values),
          accessToken,
        );
        handleCloseDrawer();
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
      setIsDeleteConfirmOpen(false);
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
    setIsDeleteConfirmOpen(false);
    setError(null);
    form.reset(
      createDefaultValues(
        filters.referenceMonth,
        user?.preferences.defaultAccountId ?? "",
      ),
    );
    focusDescriptionField();
  }

  function handleCancelCreate() {
    setIsCreating(false);
    setSelectedId(null);
    setIsDeleteConfirmOpen(false);
    setError(null);
    form.reset(
      createDefaultValues(
        filters.referenceMonth,
        user?.preferences.defaultAccountId ?? "",
      ),
    );
  }

  function handleCloseDrawer() {
    setIsCreating(false);
    setSelectedId(null);
    setIsDeleteConfirmOpen(false);
    setError(null);
    form.reset(
      createDefaultValues(
        filters.referenceMonth,
        user?.preferences.defaultAccountId ?? "",
      ),
    );
  }

  function handleOpenDeleteConfirm() {
    setDeleteScope("SINGLE");
    setIsDeleteConfirmOpen(true);
  }

  function handleCloseDeleteConfirm() {
    if (isDeleting) {
      return;
    }

    setIsDeleteConfirmOpen(false);
    setDeleteScope("SINGLE");
  }

  const activeFilters = useMemo(() => {
    const accountName =
      accounts.find((account) => account.id === filters.accountId)?.name ?? "";
    const selectedCategories = categoryOptions.filter((category) =>
      filters.categoryIds?.includes(category.id),
    );
    const memberName =
      allowanceMembers.find((member) => member.id === filters.memberId)?.name ??
      "";

    return [
      ...(filters.search
        ? [
            {
              key: "search",
              label: `${t("common.search")}: ${filters.search}`,
              onRemove: () => {
                setFilters((current) => ({ ...current, search: undefined }));
                setPage(0);
              },
            },
          ]
        : []),
      ...(filters.type
        ? [
            {
              key: "type",
              label: `${t("common.type")}: ${t(
                `transactionTypes.${filters.type}`,
              )}`,
              onRemove: () => {
                setFilters((current) => ({ ...current, type: undefined }));
                setPage(0);
              },
            },
          ]
        : []),
      ...(filters.ownershipType
        ? [
            {
              key: "ownership",
              label: `${t("common.ownership")}: ${t(
                `ownershipTypes.${filters.ownershipType}`,
              )}`,
              onRemove: () => {
                setFilters((current) => ({
                  ...current,
                  ownershipType: undefined,
                }));
                setPage(0);
              },
            },
          ]
        : []),
      ...(filters.accountId && accountName
        ? [
            {
              key: "account",
              label: `${t("common.account")}: ${accountName}`,
              onRemove: () => {
                setFilters((current) => ({ ...current, accountId: undefined }));
                setPage(0);
              },
            },
          ]
        : []),
      ...(selectedCategories.length > 0
        ? [
            {
              key: "category",
              label: formatCategoryFilterLabel(selectedCategories, t),
              onRemove: () => {
                setFilters((current) => ({
                  ...current,
                  categoryIds: undefined,
                }));
                setPage(0);
              },
            },
          ]
        : []),
      ...(filters.memberId && memberName
        ? [
            {
              key: "member",
              label: `${t("common.member")}: ${memberName}`,
              onRemove: () => {
                setFilters((current) => ({ ...current, memberId: undefined }));
                setPage(0);
              },
            },
          ]
        : []),
    ];
  }, [accounts, allowanceMembers, categoryOptions, filters, t]);

  function clearFilters() {
    setFilters((current) => ({
      referenceMonth: current.referenceMonth,
    }));
    setPage(0);
  }

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const supportsGroupedDelete = Boolean(
    selectedTransaction?.installmentGroupId,
  );
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const rangeStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const rangeEnd =
    totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);
  const hasPreviousPage = page > 0;
  const hasNextPage = page + 1 < totalPages;

  return (
    <AppShell
      title={t("transactions.title")}
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
            <FilterToolbar
              activeFilters={activeFilters}
              isPanelOpen={isFiltersOpen}
              onClearFilters={clearFilters}
              onClosePanel={() => setIsFiltersOpen(false)}
              onTogglePanel={() => setIsFiltersOpen((current) => !current)}
              primaryContent={
                <>
                  <Field
                    label={t("common.referenceMonth")}
                    htmlFor="transaction-filter-month"
                  >
                    <MonthSelector
                      id="transaction-filter-month"
                      onChange={(newMonth) => {
                        setFilters((current) => ({
                          ...current,
                          referenceMonth: newMonth,
                        }));
                        setPage(0);
                      }}
                      value={filters.referenceMonth}
                    />
                  </Field>
                  <Field
                    htmlFor="transaction-search"
                    label={t("common.search")}
                  >
                    <Input
                      id="transaction-search"
                      onChange={(event) => {
                        setFilters((current) => ({
                          ...current,
                          search:
                            event.target.value.length > 0
                              ? event.target.value
                              : undefined,
                        }));
                        setPage(0);
                      }}
                      placeholder={t("transactions.searchPlaceholder")}
                      value={filters.search ?? ""}
                    />
                  </Field>
                  <Field
                    label={t("common.type")}
                    htmlFor="transaction-filter-type"
                  >
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
                      <option value="INCOME">
                        {t("transactionTypes.INCOME")}
                      </option>
                      <option value="EXPENSE">
                        {t("transactionTypes.EXPENSE")}
                      </option>
                    </Select>
                  </Field>
                </>
              }
              secondaryContent={
                <>
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
                      <option value="SHARED">
                        {t("ownershipTypes.SHARED")}
                      </option>
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
                    label={t("common.categories")}
                    htmlFor="transaction-filter-category"
                  >
                    <CategoryMultiSelect
                      id="transaction-filter-category"
                      onChange={(value) => {
                        setFilters((current) => ({
                          ...current,
                          categoryIds: value.length > 0 ? value : undefined,
                        }));
                        setPage(0);
                      }}
                      options={categoryOptions}
                      placeholder={t("common.allCategories")}
                      value={filters.categoryIds ?? []}
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
                </>
              }
            />
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
                const cardContent = (
                  <>
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
                              {transaction.categoryName} ·{" "}
                              {transaction.accountName} ·{" "}
                              {formatDay(transaction.transactionDate)}
                              {transaction.currency === "USD" &&
                              transaction.exchangeRate != null
                                ? ` · ${formatCurrency(
                                    transaction.type === "EXPENSE"
                                      ? -Math.abs(transaction.amount)
                                      : Math.abs(transaction.amount),
                                    "USD",
                                  )} (cot. ${transaction.exchangeRate.toFixed(2)})`
                                : null}
                            </span>
                          </div>
                        </div>
                      </div>
                      <strong className={styles.transactionAmount}>
                        <MoneyAmount
                          amount={transaction.convertedAmount}
                          type={transaction.type}
                        />
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
                      {transaction.projected ? (
                        <span
                          className={`${styles.badge} ${styles.badgeMuted}`}
                        >
                          {t("transactions.projected")}
                        </span>
                      ) : null}
                    </div>
                  </>
                );

                return (
                  <Card key={transaction.id} className={styles.transactionCard}>
                    {transaction.projected ? (
                      <div
                        className={styles.transactionStatic}
                        style={
                          categoryColor
                            ? { borderInlineStartColor: categoryColor }
                            : undefined
                        }
                      >
                        {cardContent}
                      </div>
                    ) : (
                      <button
                        className={styles.transactionButton}
                        onClick={() => {
                          setIsCreating(false);
                          setSelectedId(transaction.id);
                          setIsDeleteConfirmOpen(false);
                          setError(null);
                          form.reset({
                            type: transaction.type,
                            ownershipType: transaction.ownershipType,
                            description: transaction.description,
                            amount: transaction.amount,
                            transactionDate: transaction.transactionDate,
                            accountId: transaction.accountId,
                            categoryId: transaction.categoryId,
                            memberId: transaction.memberId ?? "",
                            isInstallment: Boolean(transaction.installmentTotal),
                            installmentCount: transaction.installmentTotal ?? 2,
                          });
                          setDeleteScope("SINGLE");
                        }}
                        style={
                          categoryColor
                            ? { borderInlineStartColor: categoryColor }
                            : undefined
                        }
                        type="button"
                      >
                        {cardContent}
                      </button>
                    )}
                  </Card>
                );
              })
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
                          currency={selectedAccountCurrency}
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
                          {(["EXPENSE", "INCOME"] as const).map(
                            (typeOption) => {
                              const isActive = field.value === typeOption;
                              const toneClass =
                                typeOption === "INCOME"
                                  ? styles.segmentButtonIncome
                                  : styles.segmentButtonExpense;
                              const activeClass = isActive
                                ? (typeOption === "INCOME"
                                    ? styles.segmentButtonIncomeActive
                                    : styles.segmentButtonExpenseActive)
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
                            },
                          )}
                        </div>
                      )}
                    />
                  </Field>

                  <div className={styles.switchGrid}>
                    {user?.allowanceEnabled ? (
                      <Field
                        htmlFor="transaction-ownership-switch"
                        label={t("common.ownership")}
                      >
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
                    ) : null}

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

                  {isCreating &&
                  transactionType === "EXPENSE" &&
                  isInstallment ? (
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
                          variant="subtle"
                        >
                          {t("common.cancel")}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button loading={isSaving} type="submit">
                          {t("common.save")}
                        </Button>
                        <Button
                          disabled={isDeleting}
                          onClick={handleOpenDeleteConfirm}
                          type="button"
                          variant="danger"
                        >
{t("common.delete")}
                        </Button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </Drawer>
          ) : null}
            <ConfirmAction
              confirmLabel={t("common.delete")}
              loading={isDeleting}
              message={t(
                supportsGroupedDelete
                  ? "transactions.deleteSubtitle"
                  : "transactions.deleteSingleSubtitle",
              )}
              onCancel={handleCloseDeleteConfirm}
              onConfirm={() => void handleDelete()}
              open={isDeleteConfirmOpen}
              title={t("transactions.deleteTitle")}
            >
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
              ) : null}
            </ConfirmAction>
        </section>
      )}
    </AppShell>
  );
}
