import { zodResolver } from "@hookform/resolvers/zod";
import { type BaseSyntheticEvent, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useI18n } from "../../app/i18n/I18nContext";
import type { Account } from "../../app/api/accounts";
import type { CategoryOption } from "../../app/api/categories";
import type { FamilyMember } from "../../app/api/family";
import {
  createTransaction,
  deleteTransaction,
  listTransactionDescriptionSuggestions,
  updateTransaction,
  type DeleteScope,
  type Transaction,
  type TransactionPayload,
} from "../../app/api/transactions";
import type { AuthUser } from "../../app/api/auth";
import {
  createTransactionSchema,
  type TransactionFormValues,
} from "../../lib/validation/transactionSchema";
import { useAuth } from "../../app/auth/useAuth";
import Button from "../../components/ui/Button";
import CategorySelect from "../../components/ui/CategorySelect";
import ConfirmAction from "../../components/ui/ConfirmAction";
import CurrencyInput from "../../components/ui/CurrencyInput";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Switch from "../../components/ui/Switch";
import styles from "./TransactionsPage.module.scss";

interface TransactionFormProps {
  transaction: Transaction | null;
  user: AuthUser;
  accounts: Account[];
  categories: CategoryOption[];
  members: FamilyMember[];
  referenceMonth: string;
  onSuccess: (intent?: "save-and-create-new") => void;
  onCancel: () => void;
}

function createDefaultValues(
  referenceMonth: string,
  user: AuthUser,
): TransactionFormValues {
  return {
    type: "EXPENSE",
    ownershipType: "SHARED",
    description: "",
    amount: 0,
    transactionDate: referenceMonth,
    accountId: user.preferences?.defaultAccountId ?? "",
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

export default function TransactionForm({
  transaction,
  user,
  accounts,
  categories,
  members,
  referenceMonth,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState<DeleteScope>("SINGLE");
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<
    string[]
  >([]);

  const isCreating = transaction === null;
  const transactionId = transaction?.id ?? null;
  const installmentGroupId = transaction?.installmentGroupId ?? null;

  const initialValues = useMemo(
    (): TransactionFormValues =>
      !transaction
        ? createDefaultValues(referenceMonth, user)
        : {
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
          },
    [transaction, referenceMonth, user],
  );

  const transactionSchema = useMemo(() => createTransactionSchema(t), [t]);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form]);

  const descriptionValue = form.watch("description");
  const transactionType = form.watch("type");
  const ownershipType = form.watch("ownershipType");
  const isInstallment = form.watch("isInstallment");
  const formAccountId = form.watch("accountId");

  const selectedAccountCurrency = useMemo(
    () =>
      accounts.find((a) => a.id === formAccountId)?.currency as
        "BRL" | "USD" | undefined,
    [accounts, formAccountId],
  );

  const allowanceMembers = useMemo(
    () => members.filter((m) => m.active && m.allowanceEnabled),
    [members],
  );

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
        await createTransaction(
          mapFormValuesToCreatePayload(values),
          accessToken,
        );

        if (intent === "save-and-create-new") {
          resetForNextCreate(values);
          onSuccess("save-and-create-new");
        } else {
          onSuccess();
        }
      } else if (transactionId) {
        await updateTransaction(
          transactionId,
          mapFormValuesToUpdatePayload(values),
          accessToken,
        );
        onSuccess();
      }
    } catch {
      setError(t("transactions.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!accessToken || !transactionId) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteTransaction(transactionId, deleteScope, accessToken);
      setIsDeleteConfirmOpen(false);
      onSuccess();
    } catch {
      setError(t("transactions.deleteError"));
    } finally {
      setIsDeleting(false);
    }
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

  const supportsGroupedDelete = Boolean(installmentGroupId);

  return (
    <>
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
          <Input
            id="transaction-description"
            autoComplete="off"
            hasError={Boolean(form.formState.errors.description)}
            list="transaction-description-suggestions"
            {...form.register("description")}
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
                {(["EXPENSE", "INCOME"] as const).map((typeOption) => {
                  const isActive = field.value === typeOption;
                  const toneClass =
                    typeOption === "INCOME"
                      ? styles.segmentButtonIncome
                      : styles.segmentButtonExpense;
                  const activeClass = isActive
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
                    onChange={(event) => field.onChange(event.target.checked)}
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
                options={categories}
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
              hasError={Boolean(form.formState.errors.installmentCount)}
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
              <Button onClick={onCancel} type="button" variant="subtle">
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

      <ConfirmAction
        confirmLabel={t("common.delete")}
        loading={isDeleting}
        message={
          supportsGroupedDelete
            ? t("transactions.deleteSubtitle")
            : t("transactions.deleteSingleSubtitle")
        }
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
              <option value="ALL">{t("transactions.deleteScope.all")}</option>
            </Select>
          </Field>
        ) : null}
      </ConfirmAction>
    </>
  );
}
