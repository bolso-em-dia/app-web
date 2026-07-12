import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";
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
import CategoryMultiSelect from "../../components/ui/CategoryMultiSelect";
import Drawer from "../../components/ui/Drawer";
import MonthSelector from "../../components/ui/MonthSelector";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { useI18n } from "../../app/i18n/I18nContext";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";
import { usePagination } from "../../lib/usePagination";
import PaginationBar from "../../components/ui/PaginationBar";
import { formatReferenceMonth, getCurrentReferenceMonth } from "../../lib/formatters/date";
import {
  createTransactionSchema,
  type TransactionFormValues,
} from "../../lib/validation/transactionSchema";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";
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
  const pagination = usePagination(page, pageSize, totalItems, totalPages);

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

          <TransactionList
            transactions={transactions}
            selectedId={selectedId}
            categoryOptionsById={categoryOptionsById}
            emptyMessage={t("transactions.empty")}
            onCardSelect={(id, transaction) => {
              setIsCreating(false);
              setSelectedId(id);
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
                <TransactionForm
                  accounts={accounts}
                  allowanceMembers={allowanceMembers}
                  categoryOptions={categoryOptions}
                  deleteScope={deleteScope}
                  descriptionSuggestions={descriptionSuggestions}
                  error={error}
                  form={form}
                  isCreating={isCreating}
                  isDeleteConfirmOpen={isDeleteConfirmOpen}
                  isDeleting={isDeleting}
                  isSaving={isSaving}
                  onCancelCreate={handleCancelCreate}
                  onCloseDeleteConfirm={handleCloseDeleteConfirm}
                  onOpenDeleteConfirm={handleOpenDeleteConfirm}
                  onDeleteConfirm={() => void handleDelete()}
                  onSubmit={onSubmit}
                  selectedAccountCurrency={selectedAccountCurrency}
                  selectedTransaction={selectedTransaction}
                  setDeleteScope={setDeleteScope}
                  user={user}
                />
              </div>
            </Drawer>
          ) : null}
        </section>
      )}
    </AppShell>
  );
}
