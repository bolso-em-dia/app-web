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
        listTransactions(filters, accessToken),
        listAccounts(accessToken),
        listCategoryOptions(filters.referenceMonth, accessToken),
        listFamilyMembers(accessToken),
      ]);

      setTransactions(transactionsResponse);
      setAccounts(accountsResponse);
      setCategoryOptions(categoriesResponse);
      setMembers(membersResponse);

      if (transactionsResponse.length > 0) {
        setSelectedId((current) =>
          current &&
          transactionsResponse.some((transaction) => transaction.id === current)
            ? current
            : transactionsResponse[0].id,
        );
      } else {
        setSelectedId(null);
      }
    } catch {
      setError("Unable to load transactions.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, filters]);

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
        }
        setIsCreating(false);
      } else if (selectedTransaction) {
        const updated = await updateTransaction(
          selectedTransaction.id,
          mapFormValuesToUpdatePayload(values),
          accessToken,
        );
        setTransactions((current) =>
          current.map((transaction) =>
            transaction.id === updated.id ? updated : transaction,
          ),
        );
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
    setError(null);
    if (transactions[0]) {
      setSelectedId(transactions[0].id);
    }
  }

  const supportsGroupedDelete = Boolean(
    selectedTransaction?.installmentGroupId,
  );

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
        <section className={styles.layout}>
          <Card className={styles.filtersPanel}>
            <div className={styles.listHeader}>
              <div>
                <h2 className={styles.panelTitle}>Filters</h2>
                <p className={styles.panelSubtitle}>
                  Narrow the monthly transaction list.
                </p>
              </div>
            </div>

            <div className={styles.filtersGrid}>
              <Field label="Reference month" htmlFor="transaction-filter-month">
                <Input
                  id="transaction-filter-month"
                  type="month"
                  value={toMonthInputValue(filters.referenceMonth)}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      referenceMonth: fromMonthInputValue(event.target.value),
                    }))
                  }
                />
              </Field>

              <Field label="Type" htmlFor="transaction-filter-type">
                <Select
                  id="transaction-filter-type"
                  value={filters.type ?? ""}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      type:
                        event.target.value.length > 0
                          ? (event.target.value as TransactionType)
                          : undefined,
                    }))
                  }
                >
                  <option value="">All types</option>
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </Select>
              </Field>

              <Field label="Ownership" htmlFor="transaction-filter-ownership">
                <Select
                  id="transaction-filter-ownership"
                  value={filters.ownershipType ?? ""}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      ownershipType:
                        event.target.value.length > 0
                          ? (event.target.value as OwnershipType)
                          : undefined,
                    }))
                  }
                >
                  <option value="">All ownerships</option>
                  <option value="SHARED">Shared</option>
                  <option value="INDIVIDUAL">Individual</option>
                </Select>
              </Field>

              <Field label="Account" htmlFor="transaction-filter-account">
                <Select
                  id="transaction-filter-account"
                  value={filters.accountId ?? ""}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      accountId: event.target.value || undefined,
                    }))
                  }
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
                  value={filters.categoryId ?? ""}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      categoryId: event.target.value || undefined,
                    }))
                  }
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
                  value={filters.memberId ?? ""}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      memberId: event.target.value || undefined,
                    }))
                  }
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

          <div className={styles.contentGrid}>
            <Card className={styles.listPanel}>
              <div className={styles.listHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Transactions</h2>
                  <p className={styles.panelSubtitle}>
                    {formatReferenceMonth(filters.referenceMonth)}
                  </p>
                </div>
                <span className={styles.count}>{transactions.length}</span>
              </div>

              <div className={styles.transactionList}>
                {transactions.map((transaction) => (
                  <button
                    key={transaction.id}
                    type="button"
                    className={
                      transaction.id === selectedId && !isCreating
                        ? `${styles.transactionItem} ${styles.transactionItemActive}`
                        : styles.transactionItem
                    }
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedId(transaction.id);
                      setError(null);
                    }}
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
                ))}
              </div>
            </Card>

            <div className={styles.layout}>
              <Card className={styles.formPanel}>
                <div className={styles.formHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>
                      {isCreating ? "New transaction" : "Transaction details"}
                    </h2>
                    <p className={styles.panelSubtitle}>
                      {isCreating
                        ? "Create a monthly transaction with optional installments."
                        : "Update the selected transaction."}
                    </p>
                  </div>
                </div>

                <form
                  className={styles.form}
                  onSubmit={form.handleSubmit(onSubmit)}
                  noValidate
                >
                  <Field
                    label="Type"
                    htmlFor="transaction-type"
                    error={form.formState.errors.type?.message}
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
                    label="Ownership"
                    htmlFor="transaction-ownership"
                    error={form.formState.errors.ownershipType?.message}
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
                    label="Description"
                    htmlFor="transaction-description"
                    error={form.formState.errors.description?.message}
                  >
                    <Input
                      id="transaction-description"
                      hasError={Boolean(form.formState.errors.description)}
                      {...form.register("description")}
                    />
                  </Field>

                  <Field
                    label="Amount"
                    htmlFor="transaction-amount"
                    error={form.formState.errors.amount?.message}
                  >
                    <Input
                      id="transaction-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      hasError={Boolean(form.formState.errors.amount)}
                      {...form.register("amount")}
                    />
                  </Field>

                  <Field
                    label="Transaction date"
                    htmlFor="transaction-date"
                    error={form.formState.errors.transactionDate?.message}
                  >
                    <Input
                      id="transaction-date"
                      type="date"
                      hasError={Boolean(form.formState.errors.transactionDate)}
                      {...form.register("transactionDate")}
                    />
                  </Field>

                  <Field
                    label="Reference month"
                    htmlFor="transaction-reference-month"
                    error={form.formState.errors.referenceMonth?.message}
                  >
                    <Input
                      id="transaction-reference-month"
                      type="date"
                      hasError={Boolean(form.formState.errors.referenceMonth)}
                      {...form.register("referenceMonth")}
                    />
                  </Field>

                  <Field
                    label="Account"
                    htmlFor="transaction-account"
                    error={form.formState.errors.accountId?.message}
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
                    label="Category"
                    htmlFor="transaction-category"
                    error={form.formState.errors.categoryId?.message}
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
                      label="Member"
                      htmlFor="transaction-member"
                      error={form.formState.errors.memberId?.message}
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
                      label="Installment count"
                      htmlFor="transaction-installment-count"
                      error={form.formState.errors.installmentCount?.message}
                    >
                      <Input
                        id="transaction-installment-count"
                        type="number"
                        min="1"
                        max="120"
                        step="1"
                        hasError={Boolean(
                          form.formState.errors.installmentCount,
                        )}
                        {...form.register("installmentCount")}
                      />
                    </Field>
                  ) : null}

                  {error ? <FormError>{error}</FormError> : null}

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
              </Card>

              {!isCreating && selectedTransaction ? (
                <Card className={styles.deletePanel}>
                  <div className={styles.formHeader}>
                    <div>
                      <h2 className={styles.panelTitle}>Delete transaction</h2>
                      <p className={styles.panelSubtitle}>
                        Remove the selected transaction or the remaining
                        installments in its group.
                      </p>
                    </div>
                  </div>

                  <div className={styles.deleteSection}>
                    {supportsGroupedDelete ? (
                      <Field
                        label="Delete scope"
                        htmlFor="transaction-delete-scope"
                      >
                        <Select
                          id="transaction-delete-scope"
                          value={deleteScope}
                          onChange={(event) =>
                            setDeleteScope(event.target.value as DeleteScope)
                          }
                        >
                          <option value="SINGLE">Only this installment</option>
                          <option value="FUTURE">
                            This and future installments
                          </option>
                          <option value="ALL">Entire installment group</option>
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
          </div>
        </section>
      )}
    </AppShell>
  );
}
