import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  listCategoryOptions,
  type CategoryOption,
} from "../../app/api/categories";
import { listAccounts, type Account } from "../../app/api/accounts";
import {
  archiveFixedExpenseTemplate,
  createFixedExpenseTemplate,
  listFixedExpenseTemplates,
  updateFixedExpenseTemplate,
  type FixedExpenseTemplate,
  type FixedExpenseTemplatePayload,
} from "../../app/api/fixedExpenses";
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
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import {
  archiveFixedExpenseSchema,
  fixedExpenseSchema,
  type ArchiveFixedExpenseFormValues,
  type FixedExpenseFormValues,
} from "../../lib/validation/fixedExpenseSchema";
import styles from "./FixedExpensesPage.module.scss";

const DEFAULT_VALUES: FixedExpenseFormValues = {
  name: "",
  amount: 0,
  categoryId: "",
  accountId: "",
  dueDay: 1,
};

function toMonthInputValue(value: string) {
  return value.slice(0, 7);
}

function fromMonthInputValue(value: string) {
  return `${value}-01`;
}

function mapFormValuesToPayload(
  values: FixedExpenseFormValues,
): FixedExpenseTemplatePayload {
  return {
    name: values.name,
    amount: values.amount,
    categoryId: values.categoryId,
    accountId: values.accountId,
    dueDay: values.dueDay,
  };
}

export default function FixedExpensesPage() {
  const { accessToken } = useAuth();
  const referenceMonth = getCurrentReferenceMonth();
  const [templates, setTemplates] = useState<FixedExpenseTemplate[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? null,
    [templates, selectedId],
  );

  const form = useForm<FixedExpenseFormValues>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const archiveForm = useForm<ArchiveFixedExpenseFormValues>({
    resolver: zodResolver(archiveFixedExpenseSchema),
    defaultValues: {
      archivedFromMonth: toMonthInputValue(referenceMonth),
    },
  });

  const loadTemplates = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [templatesResponse, categoriesResponse, accountsResponse] =
        await Promise.all([
          listFixedExpenseTemplates(accessToken),
          listCategoryOptions(referenceMonth, accessToken),
          listAccounts(accessToken),
        ]);

      setTemplates(templatesResponse);
      setCategoryOptions(categoriesResponse);
      setAccounts(accountsResponse);

      if (templatesResponse.length > 0) {
        setSelectedId((current) =>
          current &&
          templatesResponse.some((template) => template.id === current)
            ? current
            : templatesResponse[0].id,
        );
      } else {
        setSelectedId(null);
      }
    } catch {
      setError("Unable to load fixed expense templates.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, referenceMonth]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (isCreating) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (selectedTemplate) {
      form.reset({
        name: selectedTemplate.name,
        amount: selectedTemplate.amount,
        categoryId: selectedTemplate.categoryId,
        accountId: selectedTemplate.accountId,
        dueDay: selectedTemplate.dueDay,
      });
    }
  }, [form, isCreating, selectedTemplate]);

  useEffect(() => {
    archiveForm.reset({
      archivedFromMonth: toMonthInputValue(
        selectedTemplate?.archivedFromMonth ?? referenceMonth,
      ),
    });
  }, [archiveForm, referenceMonth, selectedTemplate]);

  async function onSubmit(values: FixedExpenseFormValues) {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        const created = await createFixedExpenseTemplate(
          mapFormValuesToPayload(values),
          accessToken,
        );
        setTemplates((current) => [created, ...current]);
        setSelectedId(created.id);
        setIsCreating(false);
      } else if (selectedTemplate) {
        const updated = await updateFixedExpenseTemplate(
          selectedTemplate.id,
          mapFormValuesToPayload(values),
          accessToken,
        );
        setTemplates((current) =>
          current.map((template) =>
            template.id === updated.id ? updated : template,
          ),
        );
      }
    } catch {
      setError("Unable to save the fixed expense template.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onArchive(values: ArchiveFixedExpenseFormValues) {
    if (
      !accessToken ||
      !selectedTemplate ||
      selectedTemplate.archivedFromMonth
    ) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      const archived = await archiveFixedExpenseTemplate(
        selectedTemplate.id,
        {
          archivedFromMonth: fromMonthInputValue(values.archivedFromMonth),
        },
        accessToken,
      );
      setTemplates((current) =>
        current.map((template) =>
          template.id === archived.id ? archived : template,
        ),
      );
    } catch {
      setError("Unable to archive the fixed expense template.");
    } finally {
      setIsArchiving(false);
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
    if (templates[0]) {
      setSelectedId(templates[0].id);
    }
  }

  return (
    <AppShell
      title="Fixed expenses"
      subtitle="Manage recurring transaction templates."
      actions={
        <Button onClick={handleStartCreate} type="button">
          New template
        </Button>
      }
    >
      {isLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label="Loading fixed expense templates" />
        </Card>
      ) : (
        <section className={styles.layout}>
          <Card className={styles.listPanel}>
            <div className={styles.listHeader}>
              <h2 className={styles.panelTitle}>Templates</h2>
              <span className={styles.count}>{templates.length}</span>
            </div>

            <div className={styles.templateList}>
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={
                    template.id === selectedId && !isCreating
                      ? `${styles.templateItem} ${styles.templateItemActive}`
                      : styles.templateItem
                  }
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedId(template.id);
                    setError(null);
                  }}
                >
                  <div className={styles.templateHeader}>
                    <div>
                      <strong>{template.name}</strong>
                      <p className={styles.templateMeta}>
                        {template.categoryName} · {template.accountName}
                      </p>
                    </div>
                    <strong>{formatCurrency(template.amount)}</strong>
                  </div>

                  <div className={styles.templateBadges}>
                    <span className={styles.badge}>
                      Due day {template.dueDay}
                    </span>
                    {template.archivedFromMonth ? (
                      <span className={`${styles.badge} ${styles.badgeMuted}`}>
                        Archived from{" "}
                        {formatReferenceMonth(template.archivedFromMonth)}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className={styles.sidePanels}>
            <Card className={styles.formPanel}>
              <div className={styles.formHeader}>
                <div>
                  <h2 className={styles.panelTitle}>
                    {isCreating ? "New template" : "Template details"}
                  </h2>
                  <p className={styles.formSubtitle}>
                    {isCreating
                      ? "Create a recurring expense template."
                      : "Update recurring expense name, amount, category, account, and due day."}
                  </p>
                </div>
              </div>

              <form
                className={styles.form}
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
              >
                <Field
                  label="Name"
                  htmlFor="fixed-expense-name"
                  error={form.formState.errors.name?.message}
                >
                  <Input
                    id="fixed-expense-name"
                    hasError={Boolean(form.formState.errors.name)}
                    {...form.register("name")}
                  />
                </Field>

                <Field
                  label="Amount"
                  htmlFor="fixed-expense-amount"
                  error={form.formState.errors.amount?.message}
                >
                  <Input
                    id="fixed-expense-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    hasError={Boolean(form.formState.errors.amount)}
                    {...form.register("amount")}
                  />
                </Field>

                <Field
                  label="Category"
                  htmlFor="fixed-expense-category"
                  error={form.formState.errors.categoryId?.message}
                >
                  <Select
                    id="fixed-expense-category"
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

                <Field
                  label="Account"
                  htmlFor="fixed-expense-account"
                  error={form.formState.errors.accountId?.message}
                >
                  <Select
                    id="fixed-expense-account"
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
                  label="Due day"
                  htmlFor="fixed-expense-due-day"
                  error={form.formState.errors.dueDay?.message}
                >
                  <Input
                    id="fixed-expense-due-day"
                    type="number"
                    min="1"
                    max="31"
                    step="1"
                    hasError={Boolean(form.formState.errors.dueDay)}
                    {...form.register("dueDay")}
                  />
                </Field>

                {error ? <FormError>{error}</FormError> : null}

                <div className={styles.formActions}>
                  <Button loading={isSaving} type="submit">
                    {isCreating ? "Create template" : "Save changes"}
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

            {selectedTemplate && !isCreating ? (
              <>
                <Card className={styles.detailPanel}>
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>Monthly amount</span>
                    <strong className={styles.detailValue}>
                      {formatCurrency(selectedTemplate.amount)}
                    </strong>
                  </div>
                  <div className={styles.detailList}>
                    <span className={styles.badge}>
                      Category: {selectedTemplate.categoryName}
                    </span>
                    <span className={styles.badge}>
                      Account: {selectedTemplate.accountName}
                    </span>
                    <span className={styles.badge}>
                      Due day: {selectedTemplate.dueDay}
                    </span>
                    <span className={styles.badge}>
                      Created:{" "}
                      {formatReferenceMonth(selectedTemplate.createdInMonth)}
                    </span>
                  </div>
                </Card>

                <Card className={styles.archivePanel}>
                  <div className={styles.formHeader}>
                    <div>
                      <h2 className={styles.panelTitle}>Archive template</h2>
                      <p className={styles.formSubtitle}>
                        Stop generating this recurring expense from a specific
                        month onward.
                      </p>
                    </div>
                  </div>

                  <form
                    className={styles.form}
                    onSubmit={archiveForm.handleSubmit(onArchive)}
                    noValidate
                  >
                    <Field
                      label="Archive month"
                      htmlFor="fixed-expense-archive-month"
                      error={
                        archiveForm.formState.errors.archivedFromMonth?.message
                      }
                    >
                      <Input
                        id="fixed-expense-archive-month"
                        type="month"
                        hasError={Boolean(
                          archiveForm.formState.errors.archivedFromMonth,
                        )}
                        {...archiveForm.register("archivedFromMonth")}
                      />
                    </Field>

                    <Button
                      loading={isArchiving}
                      type="submit"
                      variant="secondary"
                      disabled={Boolean(selectedTemplate.archivedFromMonth)}
                    >
                      {selectedTemplate.archivedFromMonth
                        ? "Template archived"
                        : "Archive template"}
                    </Button>
                  </form>
                </Card>
              </>
            ) : null}
          </div>
        </section>
      )}
    </AppShell>
  );
}
