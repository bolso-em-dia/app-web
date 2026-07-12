import { Controller, type UseFormReturn } from "react-hook-form";
import { useI18n } from "../../app/i18n/I18nContext";
import type { CategoryOption } from "../../app/api/categories";
import type { AccountOption } from "../../app/api/accounts";
import type { FixedExpenseFormValues } from "../../lib/validation/fixedExpenseSchema";
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
  isCreating: boolean;
  form: UseFormReturn<FixedExpenseFormValues>;
  categoryOptions: CategoryOption[];
  accountOptions: AccountOption[];
  selectedAccountCurrency: "BRL" | "USD" | undefined;
  isSaving: boolean;
  isDeleting: boolean;
  isDeleteConfirmOpen: boolean;
  error: string | null;
  onSubmit: (values: FixedExpenseFormValues) => Promise<void>;
  onCancelCreate: () => void;
  onDeleteOpen: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
};

export default function FixedExpenseForm({
  isCreating,
  form,
  categoryOptions,
  accountOptions,
  selectedAccountCurrency,
  isSaving,
  isDeleting,
  isDeleteConfirmOpen,
  error,
  onSubmit,
  onCancelCreate,
  onDeleteOpen,
  onDeleteCancel,
  onDeleteConfirm,
}: FixedExpenseFormProps) {
  const { t } = useI18n();
  const selectedType = form.watch("type");

  return (
    <>
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
            <Button onClick={onCancelCreate} type="button" variant="subtle">
              {t("common.cancel")}
            </Button>
          ) : null}
          {!isCreating ? (
            <Button onClick={onDeleteOpen} type="button" variant="danger">
              {t("common.delete")}
            </Button>
          ) : null}
        </div>
      </form>

      <ConfirmAction
        confirmLabel={t("common.delete")}
        loading={isDeleting}
        message={t("confirmations.deleteFixedExpense")}
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
        open={isDeleteConfirmOpen}
        title={t("fixedTransactions.deleteAction")}
      />
    </>
  );
}
