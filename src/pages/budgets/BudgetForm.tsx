import { Controller, type UseFormReturn } from "react-hook-form";
import { useI18n } from "../../app/i18n/I18nContext";
import type { CategoryOption } from "../../app/api/categories";
import type { FamilyMember } from "../../app/api/family";
import type { Budget } from "../../app/api/budgets";
import type { BudgetFormValues } from "../../lib/validation/budgetSchema";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ConfirmAction from "../../components/ui/ConfirmAction";
import CategoryMultiSelect from "../../components/ui/CategoryMultiSelect";
import CurrencyInput from "../../components/ui/CurrencyInput";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import styles from "./BudgetsPage.module.scss";

interface BudgetFormProps {
  isCreating: boolean;
  selectedBudgetSummary: Budget | null;
  form: UseFormReturn<BudgetFormValues>;
  categoryOptions: CategoryOption[];
  availableAllowanceMembers: FamilyMember[];
  isSaving: boolean;
  isArchiving: boolean;
  isArchiveConfirmOpen: boolean;
  error: string | null;
  onSubmit: (values: BudgetFormValues) => Promise<void>;
  onCancelCreate: () => void;
  onArchiveOpen: () => void;
  onArchiveCancel: () => void;
  onArchiveConfirm: () => void;
}

export default function BudgetForm({
  isCreating,
  selectedBudgetSummary,
  form,
  categoryOptions,
  availableAllowanceMembers,
  isSaving,
  isArchiving,
  isArchiveConfirmOpen,
  error,
  onSubmit,
  onCancelCreate,
  onArchiveOpen,
  onArchiveCancel,
  onArchiveConfirm,
}: BudgetFormProps) {
  const { t } = useI18n();
  const budgetType = form.watch("type");

  return (
    <>
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
            <option value="ALLOWANCE">{t("budgetTypes.ALLOWANCE")}</option>
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
                  hasError={Boolean(form.formState.errors.categoryIds)}
                  id="budget-linked-categories"
                  onChange={field.onChange}
                  options={categoryOptions}
                  placeholder={t("common.selectCategories")}
                  value={field.value}
                />
              )}
            />
            <p className={styles.helperText}>{t("budgets.globalHelper")}</p>
          </Field>
        )}

        <FormError>{error}</FormError>

        <div className={styles.formActions}>
          <Button loading={isSaving} type="submit">
            {isCreating ? t("budgets.create") : t("common.save")}
          </Button>
          {isCreating ? (
            <Button onClick={onCancelCreate} type="button" variant="subtle">
              {t("common.cancel")}
            </Button>
          ) : (
            <Button
              disabled={Boolean(selectedBudgetSummary?.archivedFromMonth)}
              onClick={onArchiveOpen}
              type="button"
              variant={
                selectedBudgetSummary?.archivedFromMonth ? "subtle" : "danger"
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
        <>
          <Card className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <h3 className={styles.detailTitle}>
                {t("budgets.currentImpact")}
              </h3>
              <p className={styles.detailSubtitle}>
                {t("budgets.currentImpactSubtitle")}
              </p>
            </div>

            <div className={styles.detailSection}>
              <section className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>
                    {t("budgets.limit")}
                  </span>
                  <strong className={styles.summaryValue}>
                    {selectedBudgetSummary?.monthlyLimit ?? 0}
                  </strong>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>
                    {t("budgets.consumed")}
                  </span>
                  <strong className={styles.summaryValue}>
                    {selectedBudgetSummary?.consumedAmount ?? 0}
                  </strong>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>
                    {t("budgets.remaining")}
                  </span>
                  <strong className={styles.summaryValue}>
                    {selectedBudgetSummary?.remainingAmount ?? 0}
                  </strong>
                </div>
              </section>
            </div>
          </Card>

          <ConfirmAction
            confirmLabel={t("common.archive")}
            loading={isArchiving}
            message={t("confirmations.archiveBudget")}
            onCancel={onArchiveCancel}
            onConfirm={onArchiveConfirm}
            open={isArchiveConfirmOpen}
            title={t("budgets.archiveTitle")}
          />
        </>
      ) : null}
    </>
  );
}
