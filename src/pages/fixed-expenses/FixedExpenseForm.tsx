import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useI18n } from "../../app/i18n/I18nContext";
import type { CategoryOption } from "../../app/api/categories";
import type { AccountOption } from "../../app/api/accounts";
import type { AuthUser } from "../../app/api/auth";
import {
  createFixedExpenseTemplate,
  deleteFixedExpenseTemplate,
  updateFixedExpenseTemplate,
  type FixedExpenseTemplatePayload,
  type FixedExpenseTemplate,
} from "../../app/api/fixedExpenses";
import { useAuth } from "../../app/auth/useAuth";
import {
  createFixedExpenseSchema,
  type FixedExpenseFormValues,
} from "../../lib/validation/fixedExpenseSchema";
import Button from "../../components/ui/Button";
import CategorySelect from "../../components/ui/CategorySelect";
import ConfirmAction from "../../components/ui/ConfirmAction";
import CurrencyInput from "../../components/ui/CurrencyInput";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import styles from "./FixedExpensesPage.module.scss";

type FixedExpenseFormProps = {
  template: FixedExpenseTemplate | null;
  user: AuthUser;
  accountOptions: AccountOption[];
  categoryOptions: CategoryOption[];
  onSuccess: () => void;
  onCancel: () => void;
};

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

export default function FixedExpenseForm({
  template,
  user,
  accountOptions,
  categoryOptions,
  onSuccess,
  onCancel,
}: FixedExpenseFormProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreating = template === null;
  const editingId = template?.id ?? null;

  const initialValues = useMemo(() => {
    const defaults = createDefaultValues(
      user.preferences.defaultAccountId ?? "",
    );
    if (!template) {
      return defaults;
    }
    return {
      name: template.name,
      type: template.type,
      amount: template.amount,
      categoryId: template.categoryId,
      accountId: template.accountId,
      dueDay: template.dueDay,
    };
  }, [template, user.preferences.defaultAccountId]);

  const fixedExpenseSchema = useMemo(() => createFixedExpenseSchema(t), [t]);

  const form = useForm<FixedExpenseFormValues>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form]);

  const formAccountId = form.watch("accountId");
  const selectedAccountCurrency = useMemo(
    () =>
      accountOptions.find((a) => a.id === formAccountId)?.currency as
        "BRL" | "USD" | undefined,
    [accountOptions, formAccountId],
  );

  const handleSubmit = useCallback(
    async (values: FixedExpenseFormValues) => {
      if (!accessToken) {
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        if (editingId) {
          await updateFixedExpenseTemplate(
            editingId,
            mapFormValuesToPayload(values),
            accessToken,
          );
          onSuccess();
        } else {
          await createFixedExpenseTemplate(
            mapFormValuesToPayload(values),
            accessToken,
          );
          onSuccess();
        }
      } catch {
        setError(t("fixedTransactions.saveError"));
      } finally {
        setIsSaving(false);
      }
    },
    [accessToken, editingId, onSuccess, t],
  );

  const handleDelete = useCallback(async () => {
    if (!accessToken || !editingId) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteFixedExpenseTemplate(editingId, accessToken);
      onSuccess();
    } catch {
      setError(t("fixedTransactions.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  }, [accessToken, editingId, onSuccess, t]);

  const selectedType = form.watch("type");

  return (
    <>
      <form
        className={styles.form}
        onSubmit={form.handleSubmit(handleSubmit)}
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
            <Button onClick={onCancel} type="button" variant="subtle">
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

      <ConfirmAction
        confirmLabel={t("common.delete")}
        loading={isDeleting}
        message={t("confirmations.deleteFixedExpense")}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          void handleDelete();
        }}
        open={isDeleteConfirmOpen}
        title={t("fixedTransactions.deleteAction")}
      />
    </>
  );
}
