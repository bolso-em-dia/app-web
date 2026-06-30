import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { CategoryOption } from "../../app/api/categories";
import { listFamilyMembers, type FamilyMember } from "../../app/api/family";
import {
  archiveEnvelope,
  createEnvelope,
  getEnvelope,
  listEnvelopeCategoryBreakdown,
  listEnvelopes,
  updateEnvelope,
  type Envelope,
  type EnvelopeCategoryBreakdown,
  type EnvelopePayload,
  type EnvelopeType,
} from "../../app/api/envelopes";
import { listCategoryOptions } from "../../app/api/categories";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Checkbox from "../../components/ui/Checkbox";
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
  archiveEnvelopeSchema,
  envelopeSchema,
  type ArchiveEnvelopeFormValues,
  type EnvelopeFormValues,
} from "../../lib/validation/envelopeSchema";
import styles from "./EnvelopesPage.module.scss";

const DEFAULT_VALUES: EnvelopeFormValues = {
  name: "",
  type: "GLOBAL",
  ownerMemberId: "",
  categoryIds: [],
  monthlyLimit: 0,
};

const ENVELOPE_TYPE_LABELS: Record<EnvelopeType, string> = {
  GLOBAL: "Global",
  ALLOWANCE: "Allowance",
};

function toMonthInputValue(value: string) {
  return value.slice(0, 7);
}

function fromMonthInputValue(value: string) {
  return `${value}-01`;
}

function mapFormValuesToPayload(values: EnvelopeFormValues): EnvelopePayload {
  return {
    name: values.name,
    type: values.type,
    ownerMemberId:
      values.type === "ALLOWANCE" && values.ownerMemberId
        ? values.ownerMemberId
        : undefined,
    categoryIds: values.type === "GLOBAL" ? values.categoryIds : undefined,
    monthlyLimit: values.monthlyLimit,
  };
}

export default function EnvelopesPage() {
  const { accessToken } = useAuth();
  const referenceMonth = useMemo(() => getCurrentReferenceMonth(), []);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEnvelope, setSelectedEnvelope] = useState<Envelope | null>(
    null,
  );
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    EnvelopeCategoryBreakdown[]
  >([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEnvelopeSummary = useMemo(
    () => envelopes.find((envelope) => envelope.id === selectedId) ?? null,
    [envelopes, selectedId],
  );

  const form = useForm<EnvelopeFormValues>({
    resolver: zodResolver(envelopeSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const archiveForm = useForm<ArchiveEnvelopeFormValues>({
    resolver: zodResolver(archiveEnvelopeSchema),
    defaultValues: {
      archivedFromMonth: toMonthInputValue(referenceMonth),
    },
  });

  const envelopeType = form.watch("type");
  const selectedCategoryIds = form.watch("categoryIds");

  const availableAllowanceMembers = useMemo(
    () => members.filter((member) => member.active && member.allowanceEnabled),
    [members],
  );

  const loadEnvelopesData = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [envelopesResponse, categoryOptionsResponse, membersResponse] =
        await Promise.all([
          listEnvelopes(referenceMonth, accessToken),
          listCategoryOptions(referenceMonth, accessToken),
          listFamilyMembers(accessToken),
        ]);

      setEnvelopes(envelopesResponse);
      setCategoryOptions(categoryOptionsResponse);
      setMembers(membersResponse);

      if (envelopesResponse.length > 0) {
        setSelectedId((current) =>
          current &&
          envelopesResponse.some((envelope) => envelope.id === current)
            ? current
            : envelopesResponse[0].id,
        );
      } else {
        setSelectedId(null);
      }
    } catch {
      setError("Unable to load envelopes.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, referenceMonth]);

  const loadEnvelopeDetails = useCallback(async () => {
    if (!accessToken || !selectedId || isCreating) {
      setSelectedEnvelope(null);
      setCategoryBreakdown([]);
      return;
    }

    setIsDetailLoading(true);

    try {
      const [envelopeResponse, categoryBreakdownResponse] = await Promise.all([
        getEnvelope(selectedId, referenceMonth, accessToken),
        listEnvelopeCategoryBreakdown(selectedId, referenceMonth, accessToken),
      ]);
      setSelectedEnvelope(envelopeResponse);
      setCategoryBreakdown(categoryBreakdownResponse);
    } catch {
      setError("Unable to load the envelope details.");
      setSelectedEnvelope(null);
      setCategoryBreakdown([]);
    } finally {
      setIsDetailLoading(false);
    }
  }, [accessToken, isCreating, referenceMonth, selectedId]);

  useEffect(() => {
    void loadEnvelopesData();
  }, [loadEnvelopesData]);

  useEffect(() => {
    void loadEnvelopeDetails();
  }, [loadEnvelopeDetails]);

  useEffect(() => {
    if (isCreating) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (selectedEnvelope) {
      form.reset({
        name: selectedEnvelope.name,
        type: selectedEnvelope.type,
        ownerMemberId: selectedEnvelope.ownerMemberId ?? "",
        categoryIds: selectedEnvelope.categories.map((category) => category.id),
        monthlyLimit: selectedEnvelope.monthlyLimit,
      });
    } else if (selectedEnvelopeSummary) {
      form.reset({
        name: selectedEnvelopeSummary.name,
        type: selectedEnvelopeSummary.type,
        ownerMemberId: selectedEnvelopeSummary.ownerMemberId ?? "",
        categoryIds: selectedEnvelopeSummary.categories.map(
          (category) => category.id,
        ),
        monthlyLimit: selectedEnvelopeSummary.monthlyLimit,
      });
    }
  }, [form, isCreating, selectedEnvelope, selectedEnvelopeSummary]);

  useEffect(() => {
    archiveForm.reset({
      archivedFromMonth: toMonthInputValue(
        selectedEnvelope?.archivedFromMonth ?? referenceMonth,
      ),
    });
  }, [archiveForm, referenceMonth, selectedEnvelope]);

  function handleToggleCategory(categoryId: string, checked: boolean) {
    const nextValues = checked
      ? [...selectedCategoryIds, categoryId]
      : selectedCategoryIds.filter((value) => value !== categoryId);

    form.setValue("categoryIds", nextValues, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  async function onSubmit(values: EnvelopeFormValues) {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        const created = await createEnvelope(
          mapFormValuesToPayload(values),
          accessToken,
        );
        setEnvelopes((current) => [created, ...current]);
        setSelectedId(created.id);
        setIsCreating(false);
      } else if (selectedEnvelopeSummary) {
        const updated = await updateEnvelope(
          selectedEnvelopeSummary.id,
          mapFormValuesToPayload(values),
          accessToken,
        );
        setEnvelopes((current) =>
          current.map((envelope) =>
            envelope.id === updated.id ? updated : envelope,
          ),
        );
      }
      await loadEnvelopesData();
    } catch {
      setError("Unable to save the envelope.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onArchive(values: ArchiveEnvelopeFormValues) {
    if (
      !accessToken ||
      !selectedEnvelopeSummary ||
      selectedEnvelopeSummary.archivedFromMonth
    ) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      const archived = await archiveEnvelope(
        selectedEnvelopeSummary.id,
        {
          archivedFromMonth: fromMonthInputValue(values.archivedFromMonth),
        },
        accessToken,
      );
      setEnvelopes((current) =>
        current.map((envelope) =>
          envelope.id === archived.id ? archived : envelope,
        ),
      );
      await loadEnvelopesData();
    } catch {
      setError("Unable to archive the envelope.");
    } finally {
      setIsArchiving(false);
    }
  }

  function handleStartCreate() {
    setIsCreating(true);
    setSelectedId(null);
    setSelectedEnvelope(null);
    setCategoryBreakdown([]);
    setError(null);
  }

  function handleCancelCreate() {
    setIsCreating(false);
    setError(null);
    if (envelopes[0]) {
      setSelectedId(envelopes[0].id);
    }
  }

  return (
    <AppShell
      title="Envelopes"
      subtitle="Manage global budgets and member allowance envelopes."
      actions={
        <Button onClick={handleStartCreate} type="button">
          New envelope
        </Button>
      }
    >
      {isLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label="Loading envelopes" />
        </Card>
      ) : (
        <section className={styles.layout}>
          <Card className={styles.listPanel}>
            <div className={styles.listHeader}>
              <div>
                <h2 className={styles.panelTitle}>Envelopes</h2>
                <p className={styles.listMeta}>
                  {formatReferenceMonth(referenceMonth)}
                </p>
              </div>
              <span className={styles.count}>{envelopes.length}</span>
            </div>

            <div className={styles.envelopeList}>
              {envelopes.map((envelope) => (
                <button
                  key={envelope.id}
                  type="button"
                  className={
                    envelope.id === selectedId && !isCreating
                      ? `${styles.envelopeItem} ${styles.envelopeItemActive}`
                      : styles.envelopeItem
                  }
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedId(envelope.id);
                    setError(null);
                  }}
                >
                  <div className={styles.envelopeTop}>
                    <div>
                      <strong>{envelope.name}</strong>
                      <p className={styles.envelopeMeta}>
                        {envelope.type === "ALLOWANCE" &&
                        envelope.ownerMemberName
                          ? `Allowance for ${envelope.ownerMemberName}`
                          : `${envelope.categories.length} linked categories`}
                      </p>
                    </div>
                    <strong>{formatCurrency(envelope.remainingAmount)}</strong>
                  </div>

                  <div className={styles.badgeRow}>
                    <span className={styles.badge}>
                      {ENVELOPE_TYPE_LABELS[envelope.type]}
                    </span>
                    {envelope.archivedFromMonth ? (
                      <span className={`${styles.badge} ${styles.badgeMuted}`}>
                        Archived from{" "}
                        {formatReferenceMonth(envelope.archivedFromMonth)}
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
                    {isCreating ? "New envelope" : "Envelope details"}
                  </h2>
                  <p className={styles.formSubtitle}>
                    {isCreating
                      ? "Create a global budget or allowance envelope."
                      : "Update limits, owner, and linked categories."}
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
                  htmlFor="envelope-name"
                  error={form.formState.errors.name?.message}
                >
                  <Input
                    id="envelope-name"
                    hasError={Boolean(form.formState.errors.name)}
                    {...form.register("name")}
                  />
                </Field>

                <Field
                  label="Type"
                  htmlFor="envelope-type"
                  error={form.formState.errors.type?.message}
                >
                  <Select
                    id="envelope-type"
                    hasError={Boolean(form.formState.errors.type)}
                    {...form.register("type")}
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="ALLOWANCE">Allowance</option>
                  </Select>
                </Field>

                <Field
                  label="Monthly limit"
                  htmlFor="envelope-monthly-limit"
                  error={form.formState.errors.monthlyLimit?.message}
                >
                  <Input
                    id="envelope-monthly-limit"
                    type="number"
                    min="0.01"
                    step="0.01"
                    hasError={Boolean(form.formState.errors.monthlyLimit)}
                    {...form.register("monthlyLimit")}
                  />
                </Field>

                {envelopeType === "ALLOWANCE" ? (
                  <Field
                    label="Owner member"
                    htmlFor="envelope-owner-member"
                    error={form.formState.errors.ownerMemberId?.message}
                  >
                    <Select
                      id="envelope-owner-member"
                      hasError={Boolean(form.formState.errors.ownerMemberId)}
                      {...form.register("ownerMemberId")}
                    >
                      <option value="">Select a member</option>
                      {availableAllowanceMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  <div className={styles.sectionBlock}>
                    <span className={styles.panelTitle}>Linked categories</span>
                    <div className={styles.checkboxGroup}>
                      <div className={styles.checkboxList}>
                        {categoryOptions.map((category) => (
                          <Checkbox
                            key={category.id}
                            checked={selectedCategoryIds.includes(category.id)}
                            label={category.name}
                            onChange={(event) =>
                              handleToggleCategory(
                                category.id,
                                event.currentTarget.checked,
                              )
                            }
                          />
                        ))}
                      </div>
                      <p className={styles.helperText}>
                        Global envelopes consume shared expense categories.
                      </p>
                    </div>
                    {form.formState.errors.categoryIds?.message ? (
                      <FormError>
                        {form.formState.errors.categoryIds.message}
                      </FormError>
                    ) : null}
                  </div>
                )}

                {error ? <FormError>{error}</FormError> : null}

                <div className={styles.formActions}>
                  <Button loading={isSaving} type="submit">
                    {isCreating ? "Create envelope" : "Save changes"}
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

            <Card className={styles.detailPanel}>
              <div className={styles.detailHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Current month impact</h2>
                  <p className={styles.detailSubtitle}>
                    Consumption and matching transactions for{" "}
                    {formatReferenceMonth(referenceMonth)}.
                  </p>
                </div>
              </div>

              {isDetailLoading ? (
                <Spinner label="Loading envelope details" />
              ) : selectedEnvelope ? (
                <div className={styles.detailSection}>
                  <section className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>Limit</span>
                      <strong className={styles.summaryValue}>
                        {formatCurrency(selectedEnvelope.monthlyLimit)}
                      </strong>
                    </div>
                    <div className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>Consumed</span>
                      <strong className={styles.summaryValue}>
                        {formatCurrency(selectedEnvelope.consumedAmount)}
                      </strong>
                    </div>
                    <div className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>Remaining</span>
                      <strong className={styles.summaryValue}>
                        {formatCurrency(selectedEnvelope.remainingAmount)}
                      </strong>
                    </div>
                  </section>

                  <section className={styles.detailSection}>
                    <h3 className={styles.panelTitle}>Category breakdown</h3>
                    {categoryBreakdown.length > 0 ? (
                      <div className={styles.detailList}>
                        {categoryBreakdown.map((item) => (
                          <div
                            key={item.categoryId}
                            className={styles.detailRow}
                          >
                            <strong>{item.categoryName}</strong>
                            <strong>{formatCurrency(item.amount)}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyState}>
                        No category consumption for this envelope in the current
                        month.
                      </div>
                    )}
                  </section>

                  <section className={styles.detailSection}>
                    <h3 className={styles.panelTitle}>Matched transactions</h3>
                    {selectedEnvelope.transactions.length > 0 ? (
                      <div className={styles.transactionList}>
                        {selectedEnvelope.transactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className={styles.transactionRow}
                          >
                            <div>
                              <strong>{transaction.description}</strong>
                              <p className={styles.itemMeta}>
                                {transaction.categoryName} ·{" "}
                                {transaction.accountName} ·{" "}
                                {formatDay(transaction.transactionDate)}
                              </p>
                            </div>
                            <strong>
                              {formatCurrency(transaction.amount)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyState}>
                        No transactions matched this envelope for the current
                        month.
                      </div>
                    )}
                  </section>

                  <section className={styles.detailSection}>
                    <h3 className={styles.panelTitle}>Linked categories</h3>
                    {selectedEnvelope.categories.length > 0 ? (
                      <div className={styles.categoryList}>
                        {selectedEnvelope.categories.map((category) => (
                          <span key={category.id} className={styles.badge}>
                            {category.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyState}>
                        This allowance envelope does not use shared categories.
                      </div>
                    )}
                  </section>
                </div>
              ) : (
                <p className={styles.body}>
                  Select an envelope to review its current month details.
                </p>
              )}
            </Card>

            {!isCreating && selectedEnvelopeSummary ? (
              <Card className={styles.archivePanel}>
                <div className={styles.formHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Archive envelope</h2>
                    <p className={styles.formSubtitle}>
                      Stop using this envelope from a future reference month.
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
                    htmlFor="envelope-archive-month"
                    error={
                      archiveForm.formState.errors.archivedFromMonth?.message
                    }
                  >
                    <Input
                      id="envelope-archive-month"
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
                    disabled={Boolean(
                      selectedEnvelopeSummary.archivedFromMonth,
                    )}
                  >
                    {selectedEnvelopeSummary.archivedFromMonth
                      ? "Envelope archived"
                      : "Archive envelope"}
                  </Button>
                </form>
              </Card>
            ) : null}
          </div>
        </section>
      )}
    </AppShell>
  );
}
