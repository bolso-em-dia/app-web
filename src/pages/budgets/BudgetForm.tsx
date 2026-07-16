import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import type { CategoryOption } from "../../app/api/categories";
import type { FamilyMember } from "../../app/api/family";
import { archiveBudget, createBudget, updateBudget, type Budget, type BudgetPayload } from "../../app/api/budgets";
import { createBudgetSchema, type BudgetFormValues } from "../../lib/validation/budgetSchema";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ConfirmAction from "../../components/ui/ConfirmAction";
import CategoryMultiSelect from "../../components/ui/CategoryMultiSelect";
import CurrencyInput from "../../components/ui/CurrencyInput";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { useConfirmDialog } from "../../lib/useConfirmDialog";
import styles from "./BudgetsPage.module.scss";

const DEFAULT_VALUES: BudgetFormValues = {
  name: "",
  type: "GLOBAL",
  ownerMemberId: "",
  categoryIds: [],
  monthlyLimit: 0,
};

function mapFormValuesToPayload(values: BudgetFormValues): BudgetPayload {
  return {
    name: values.name,
    type: values.type,
    ownerMemberId: values.type === "ALLOWANCE" && values.ownerMemberId ? values.ownerMemberId : undefined,
    categoryIds: values.type === "GLOBAL" ? values.categoryIds : undefined,
    monthlyLimit: values.monthlyLimit,
  };
}

interface BudgetFormProps {
  budget: Budget | null;
  categories: CategoryOption[];
  members: FamilyMember[];
  allowanceBudgets: Budget[];
  referenceMonth: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BudgetForm({
  budget,
  categories,
  members,
  allowanceBudgets,
  referenceMonth,
  onSuccess,
  onCancel,
}: BudgetFormProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { closeDialog: closeArchiveDialog, open: isArchiveDialogOpen, openDialog: openArchiveDialog } = useConfirmDialog();

  const budgetSchema = useMemo(() => createBudgetSchema(t), [t]);
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const initialValues = useMemo(() => {
    if (!budget) {
      return DEFAULT_VALUES;
    }
    return {
      name: budget.name,
      type: budget.type,
      ownerMemberId: budget.ownerMemberId ?? "",
      categoryIds: budget.categories.map((c) => c.id),
      monthlyLimit: budget.monthlyLimit,
    };
  }, [budget]);

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [initialValues, form]);

  const availableAllowanceMembers = useMemo(() => {
    const currentOwnerId = budget?.type === "ALLOWANCE" ? budget.ownerMemberId : null;
    const ownerIdsWithAllowance = new Set(
      allowanceBudgets
        .map((allowanceBudget) => allowanceBudget.ownerMemberId)
        .filter((ownerMemberId): ownerMemberId is string => Boolean(ownerMemberId) && ownerMemberId !== currentOwnerId),
    );

    return members.filter((member) => member.active && !ownerIdsWithAllowance.has(member.id));
  }, [allowanceBudgets, budget, members]);

  const isCreating = !budget;
  const budgetType = form.watch("type");

  const handleSubmit = useCallback(
    async (values: BudgetFormValues) => {
      if (!accessToken) {
        setError(t("common.sessionExpired"));
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        if (budget) {
          await updateBudget(budget.id, mapFormValuesToPayload(values), accessToken);
        } else {
          await createBudget(mapFormValuesToPayload(values), accessToken);
        }
        onSuccess();
      } catch (submitError) {
        console.error("Failed to save budget.", submitError);
        setError(t("budgets.saveError"));
      } finally {
        setIsSaving(false);
      }
    },
    [accessToken, budget, onSuccess, t],
  );

  const handleArchive = useCallback(async () => {
    if (!budget || budget.archivedFromMonth) {
      return;
    }

    if (!accessToken) {
      setError(t("common.sessionExpired"));
      return;
    }

    closeArchiveDialog();
    setIsArchiving(true);
    setError(null);

    try {
      await archiveBudget(budget.id, referenceMonth, accessToken);
      onSuccess();
    } catch (archiveError) {
      console.error("Failed to archive budget.", archiveError);
      setError(t("budgets.archiveError"));
    } finally {
      setIsArchiving(false);
    }
  }, [accessToken, budget, closeArchiveDialog, referenceMonth, onSuccess, t]);

  return (
    <>
      <form className={styles.form} onSubmit={form.handleSubmit(handleSubmit)} noValidate>
        <Field error={form.formState.errors.name?.message} htmlFor="budget-name" label={t("common.name")}>
          <Input id="budget-name" hasError={Boolean(form.formState.errors.name)} {...form.register("name")} />
        </Field>

        <Field error={form.formState.errors.type?.message} htmlFor="budget-type" label={t("common.type")}>
          <Select id="budget-type" hasError={Boolean(form.formState.errors.type)} {...form.register("type")}>
            <option value="GLOBAL">{t("budgetTypes.GLOBAL")}</option>
            <option value="ALLOWANCE">{t("budgetTypes.ALLOWANCE")}</option>
          </Select>
        </Field>

        <Field error={form.formState.errors.monthlyLimit?.message} htmlFor="budget-monthly-limit" label={t("budgets.monthlyLimit")}>
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
          <Field error={form.formState.errors.ownerMemberId?.message} htmlFor="budget-owner-member" label={t("budgets.ownerMember")}>
            <Select id="budget-owner-member" hasError={Boolean(form.formState.errors.ownerMemberId)} {...form.register("ownerMemberId")}>
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
                  options={categories}
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
            <Button onClick={onCancel} type="button" variant="subtle">
              {t("common.cancel")}
            </Button>
          ) : (
            <Button
              disabled={Boolean(budget?.archivedFromMonth)}
              onClick={openArchiveDialog}
              type="button"
              variant={budget?.archivedFromMonth ? "subtle" : "danger"}
            >
              {budget?.archivedFromMonth ? t("budgets.archived") : t("common.archive")}
            </Button>
          )}
        </div>
      </form>

      {!isCreating ? (
        <>
          <Card className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <h3 className={styles.detailTitle}>{t("budgets.currentImpact")}</h3>
              <p className={styles.detailSubtitle}>{t("budgets.currentImpactSubtitle")}</p>
            </div>

            <div className={styles.detailSection}>
              <section className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>{t("budgets.limit")}</span>
                  <strong className={styles.summaryValue}>{budget?.monthlyLimit ?? 0}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>{t("budgets.consumed")}</span>
                  <strong className={styles.summaryValue}>{budget?.consumedAmount ?? 0}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>{t("budgets.remaining")}</span>
                  <strong className={styles.summaryValue}>{budget?.remainingAmount ?? 0}</strong>
                </div>
              </section>
            </div>
          </Card>

          <ConfirmAction
            confirmLabel={t("common.archive")}
            loading={isArchiving}
            message={t("confirmations.archiveBudget")}
            onCancel={closeArchiveDialog}
            onConfirm={handleArchive}
            open={isArchiveDialogOpen}
            title={t("budgets.archiveTitle")}
          />
        </>
      ) : null}
    </>
  );
}
