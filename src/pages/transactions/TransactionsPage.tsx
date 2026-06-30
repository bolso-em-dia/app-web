import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import Drawer from "../../components/ui/Drawer";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
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

const DEFAULT_VALUES: TransactionFormValues = {
  type: "EXPENSE",
  ownershipType: "SHARED",
  description: "",
  amount: 0,
  transactionDate: getCurrentReferenceMonth(),
  referenceMonth: getCurrentReferenceMonth(),
  accountId: "",
  categoryId: "",
  memberId: "",
  installmentCount: 1,
};
const DEFAULT_PAGE_SIZE = 12;

const TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
};

const OWNERSHIP_LABELS: Record<OwnershipType, string> = {
  SHARED: "Shared",
  INDIVIDUAL: "Individual",
};

function toMonthInputValue(value: string) {
  return value.slice(0, 7);
}

function fromMonthInputValue(value: string) {
  return `${value}-01`;
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
    referenceMonth: values.referenceMonth,
    accountId: values.accountId,
    categoryId: values.categoryId,
    memberId:
      values.ownershipType === "INDIVIDUAL" ? values.memberId : undefined,
    installmentCount:
      values.installmentCount && values.installmentCount > 1
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
    referenceMonth: values.referenceMonth,
    accountId: values.accountId,
    categoryId: values.categoryId,
    memberId:
      values.ownershipType === "INDIVIDUAL" ? values.memberId : undefined,
  };
}

export default function TransactionsPage() {
  const { accessToken } = useAuth();
  const initialReferenceMonth = useMemo(() => getCurrentReferenceMonth(), []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    defaultValues: DEFAULT_VALUES,
  });

  const transactionType = form.watch("type");
  const ownershipType = form.watch("ownershipType");
  const currentReferenceMonth = form.watch("referenceMonth");
  const allowanceMembers = useMemo(
    () => members.filter((member) => member.active && member.allowanceEnabled),
    [members],
  );

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
      setError("Unable to load transactions.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, filters, page, pageSize]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (isCreating) {
      form.reset({
        ...DEFAULT_VALUES,
        transactionDate: filters.referenceMonth,
        referenceMonth: filters.referenceMonth,
      });
      return;
    }

    if (selectedTransaction) {
      form.reset({
        type: selectedTransaction.type,
        ownershipType: selectedTransaction.ownershipType,
        description: selectedTransaction.description,
        amount: selectedTransaction.amount,
        transactionDate: selectedTransaction.transactionDate,
        referenceMonth: selectedTransaction.referenceMonth,
        accountId: selectedTransaction.accountId,
        categoryId: selectedTransaction.categoryId,
        memberId: selectedTransaction.memberId ?? "",
        installmentCount: selectedTransaction.installmentTotal ?? 1,
      });
      setDeleteScope("SINGLE");
    }
  }, [filters.referenceMonth, form, isCreating, selectedTransaction]);

  useEffect(() => {
    if (currentReferenceMonth === filters.referenceMonth) {
      return;
    }

    if (!currentReferenceMonth) {
      return;
    }

    const updateCategories = async () => {
      if (!accessToken) {
        return;
      }

      try {
        const response = await listCategoryOptions(
          currentReferenceMonth,
          accessToken,
        );
        setCategoryOptions(response);
      } catch {
        setError("Unable to refresh category options.");
      }
    };

    void updateCategories();
  }, [accessToken, currentReferenceMonth, filters.referenceMonth]);

  async function onSubmit(values: TransactionFormValues) {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        const created = await createTransaction(
          mapFormValuesToCreatePayload(values),
          accessToken,
        );
        if (created[0]) {
          setSelectedId(created[0].id);
          setPage(0);
          setFilters((current) => ({
            ...current,
            referenceMonth: created[0].referenceMonth,
          }));
        }
        setIsCreating(false);
      } else if (selectedTransaction) {
        const updated = await updateTransaction(
          selectedTransaction.id,
          mapFormValuesToUpdatePayload(values),
          accessToken,
        );
        setSelectedId(updated.id);
        setPage(0);
      }

      await loadPageData();
    } catch {
      setError("Unable to save the transaction.");
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
      setError("Unable to delete the transaction.");
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
      title="Transactions"
      subtitle="Review, filter, create, edit, and delete monthly transactions."
      actions={
        <Button onClick={handleStartCreate} type="button">
          New transaction
        </Button>
      }
    >
      {isLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label="Loading transactions" />
        </Card>
      ) : (
        <section className={styles.stack}>
          <Card className={styles.toolbarPanel}>
            <div className={styles.filtersGrid}>
              <Field label="Reference month" htmlFor="transaction-filter-month">
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

              <Field label="Type" htmlFor="transaction-filter-type">
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
                  <option value="">All types</option>
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </Select>
              </Field>

              <Field label="Ownership" htmlFor="transaction-filter-ownership">
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
                  <option value="">All ownerships</option>
                  <option value="SHARED">Shared</option>
                  <option value="INDIVIDUAL">Individual</option>
                </Select>
              </Field>

              <Field label="Account" htmlFor="transaction-filter-account">
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
                  <option value="">All accounts</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Category" htmlFor="transaction-filter-category">
                <Select
                  id="transaction-filter-category"
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      categoryId: event.target.value || undefined,
                    }));
                    setPage(0);
                  }}
                  value={filters.categoryId ?? ""}
                >
                  <option value="">All categories</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Member" htmlFor="transaction-filter-member">
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
                  <option value="">All members</option>
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
                <p>No transactions found for the current filters.</p>
              </Card>
            ) : (
              transactions.map((transaction) => (
                <Card key={transaction.id} className={styles.transactionCard}>
                  <button
                    className={styles.transactionButton}
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedId(transaction.id);
                      setError(null);
                    }}
                    type="button"
                  >
                    <div className={styles.transactionTop}>
                      <div>
                        <strong>{transaction.description}</strong>
                        <p className={styles.transactionMeta}>
                          {transaction.categoryName} · {transaction.accountName}{" "}
                          · {formatDay(transaction.transactionDate)}
                        </p>
                      </div>
                      <strong>{formatCurrency(transaction.amount)}</strong>
                    </div>

                    <div className={styles.badgeRow}>
                      <span className={styles.badge}>
                        {TYPE_LABELS[transaction.type]}
                      </span>
                      <span className={styles.badge}>
                        {OWNERSHIP_LABELS[transaction.ownershipType]}
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
              ))
            )}
          </section>

          <Card className={styles.footerPanel}>
            <div className={styles.footer}>
              <span className={styles.rangeLabel}>
                {rangeStart}-{rangeEnd} of {totalItems}
              </span>

              <div className={styles.paginationControls}>
                <label className={styles.rowsControl}>
                  <span>Rows</span>
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
                    Previous
                  </Button>
                  <Button
                    disabled={!hasNextPage}
                    onClick={() => setPage((current) => current + 1)}
                    type="button"
                    variant="secondary"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {isCreating || selectedTransaction ? (
            <Drawer
              description={
                isCreating
                  ? "Create a monthly transaction with optional installments."
                  : `Update the transaction for ${formatReferenceMonth(filters.referenceMonth)}.`
              }
              onClose={handleCloseDrawer}
              title={isCreating ? "New transaction" : "Transaction details"}
            >
              <div className={styles.drawerStack}>
                <form
                  className={styles.form}
                  onSubmit={form.handleSubmit(onSubmit)}
                  noValidate
                >
                  <Field
                    error={form.formState.errors.type?.message}
                    htmlFor="transaction-type"
                    label="Type"
                  >
                    <Select
                      id="transaction-type"
                      hasError={Boolean(form.formState.errors.type)}
                      {...form.register("type")}
                    >
                      <option value="EXPENSE">Expense</option>
                      <option value="INCOME">Income</option>
                    </Select>
                  </Field>

                  <Field
                    error={form.formState.errors.ownershipType?.message}
                    htmlFor="transaction-ownership"
                    label="Ownership"
                  >
                    <Select
                      id="transaction-ownership"
                      hasError={Boolean(form.formState.errors.ownershipType)}
                      {...form.register("ownershipType")}
                    >
                      <option value="SHARED">Shared</option>
                      <option value="INDIVIDUAL">Individual</option>
                    </Select>
                  </Field>

                  <Field
                    error={form.formState.errors.description?.message}
                    htmlFor="transaction-description"
                    label="Description"
                  >
                    <Input
                      id="transaction-description"
                      hasError={Boolean(form.formState.errors.description)}
                      {...form.register("description")}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.amount?.message}
                    htmlFor="transaction-amount"
                    label="Amount"
                  >
                    <Input
                      id="transaction-amount"
                      hasError={Boolean(form.formState.errors.amount)}
                      min="0.01"
                      step="0.01"
                      type="number"
                      {...form.register("amount")}
                    />
                  </Field>

                  <div className={styles.dateGrid}>
                    <Field
                      error={form.formState.errors.transactionDate?.message}
                      htmlFor="transaction-date"
                      label="Transaction date"
                    >
                      <Input
                        id="transaction-date"
                        hasError={Boolean(
                          form.formState.errors.transactionDate,
                        )}
                        type="date"
                        {...form.register("transactionDate")}
                      />
                    </Field>

                    <Field
                      error={form.formState.errors.referenceMonth?.message}
                      htmlFor="transaction-reference-month"
                      label="Reference month"
                    >
                      <Input
                        id="transaction-reference-month"
                        hasError={Boolean(form.formState.errors.referenceMonth)}
                        type="date"
                        {...form.register("referenceMonth")}
                      />
                    </Field>
                  </div>

                  <Field
                    error={form.formState.errors.accountId?.message}
                    htmlFor="transaction-account"
                    label="Account"
                  >
                    <Select
                      id="transaction-account"
                      hasError={Boolean(form.formState.errors.accountId)}
                      {...form.register("accountId")}
                    >
                      <option value="">Select an account</option>
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
                    label="Category"
                  >
                    <Select
                      id="transaction-category"
                      hasError={Boolean(form.formState.errors.categoryId)}
                      {...form.register("categoryId")}
                    >
                      <option value="">Select a category</option>
                      {categoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  {ownershipType === "INDIVIDUAL" ? (
                    <Field
                      error={form.formState.errors.memberId?.message}
                      htmlFor="transaction-member"
                      label="Member"
                    >
                      <Select
                        id="transaction-member"
                        hasError={Boolean(form.formState.errors.memberId)}
                        {...form.register("memberId")}
                      >
                        <option value="">Select a member</option>
                        {allowanceMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  ) : null}

                  {isCreating && transactionType === "EXPENSE" ? (
                    <Field
                      error={form.formState.errors.installmentCount?.message}
                      htmlFor="transaction-installment-count"
                      label="Installment count"
                    >
                      <Input
                        id="transaction-installment-count"
                        hasError={Boolean(
                          form.formState.errors.installmentCount,
                        )}
                        max="120"
                        min="1"
                        step="1"
                        type="number"
                        {...form.register("installmentCount")}
                      />
                    </Field>
                  ) : null}

                  <FormError>{error}</FormError>

                  <div className={styles.formActions}>
                    <Button loading={isSaving} type="submit">
                      {isCreating ? "Create transaction" : "Save changes"}
                    </Button>
                    {isCreating ? (
                      <Button
                        onClick={handleCancelCreate}
                        type="button"
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </form>

                {!isCreating && selectedTransaction ? (
                  <Card className={styles.deletePanel}>
                    <div className={styles.deleteHeader}>
                      <h3 className={styles.deleteTitle}>Delete transaction</h3>
                      <p className={styles.helperText}>
                        Remove the selected transaction or the remaining
                        installments in its group.
                      </p>
                    </div>

                    <div className={styles.deleteSection}>
                      {supportsGroupedDelete ? (
                        <Field
                          htmlFor="transaction-delete-scope"
                          label="Delete scope"
                        >
                          <Select
                            id="transaction-delete-scope"
                            onChange={(event) =>
                              setDeleteScope(event.target.value as DeleteScope)
                            }
                            value={deleteScope}
                          >
                            <option value="SINGLE">
                              Only this installment
                            </option>
                            <option value="FUTURE">
                              This and future installments
                            </option>
                            <option value="ALL">
                              Entire installment group
                            </option>
                          </Select>
                        </Field>
                      ) : (
                        <p className={styles.helperText}>
                          This transaction is not part of an installment group.
                        </p>
                      )}

                      <Button
                        loading={isDeleting}
                        onClick={() => void handleDelete()}
                        type="button"
                        variant="secondary"
                      >
                        Delete transaction
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
