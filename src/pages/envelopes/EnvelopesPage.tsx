import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  listCategoryOptions,
  type CategoryOption,
} from "../../app/api/categories";
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
  type EnvelopeListParams,
  type EnvelopePayload,
  type EnvelopeType,
} from "../../app/api/envelopes";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Checkbox from "../../components/ui/Checkbox";
import Drawer from "../../components/ui/Drawer";
import CurrencyInput from "../../components/ui/CurrencyInput";
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
import { envelopeSchema, type EnvelopeFormValues } from "../../lib/validation/envelopeSchema";
import { useI18n } from "../../app/i18n/I18nContext";
import styles from "./EnvelopesPage.module.scss";

const DEFAULT_VALUES: EnvelopeFormValues = {
  name: "",
  type: "GLOBAL",
  ownerMemberId: "",
  categoryIds: [],
  monthlyLimit: 0,
};
const DEFAULT_PAGE_SIZE = 12;

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
  const { t } = useI18n();
  const initialReferenceMonth = useMemo(() => getCurrentReferenceMonth(), []);
  const [referenceMonth, setReferenceMonth] = useState(initialReferenceMonth);
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ACTIVE");
  const [typeFilter, setTypeFilter] = useState<"" | EnvelopeType>("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
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

  const envelopeType = form.watch("type");
  const selectedCategoryIds = form.watch("categoryIds");

  const availableAllowanceMembers = useMemo(
    () => members.filter((member) => member.active && member.allowanceEnabled),
    [members],
  );

  const loadEnvelopesData = useCallback(
    async (params: EnvelopeListParams) => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [envelopesResponse, categoryOptionsResponse, membersResponse] =
          await Promise.all([
            listEnvelopes(params, accessToken),
            listCategoryOptions(params.referenceMonth, accessToken),
            listFamilyMembers(accessToken),
          ]);

        setEnvelopes(envelopesResponse.items);
        setPage(envelopesResponse.page);
        setPageSize(envelopesResponse.size);
        setTotalItems(envelopesResponse.totalItems);
        setTotalPages(envelopesResponse.totalPages);
        setCategoryOptions(categoryOptionsResponse);
        setMembers(membersResponse);
        setSelectedId((current) =>
          current &&
          envelopesResponse.items.some((envelope) => envelope.id === current)
            ? current
            : null,
        );
      } catch {
        setError(t("envelopes.error"));
      } finally {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [accessToken, t],
  );

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
      setError(t("envelopes.detailsError"));
      setSelectedEnvelope(null);
      setCategoryBreakdown([]);
    } finally {
      setIsDetailLoading(false);
    }
  }, [accessToken, isCreating, referenceMonth, selectedId, t]);

  useEffect(() => {
    void loadEnvelopesData({
      referenceMonth,
      page,
      size: pageSize,
      search,
      status: statusFilter,
      type: typeFilter || undefined,
    });
  }, [
    loadEnvelopesData,
    page,
    pageSize,
    referenceMonth,
    search,
    statusFilter,
    typeFilter,
  ]);

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
        setSelectedId(created.id);
        setIsCreating(false);
        await loadEnvelopesData({
          referenceMonth,
          page,
          size: pageSize,
          search,
          status: statusFilter,
          type: typeFilter || undefined,
        });
      } else if (selectedEnvelopeSummary) {
        const updated = await updateEnvelope(
          selectedEnvelopeSummary.id,
          mapFormValuesToPayload(values),
          accessToken,
        );
        setSelectedId(updated.id);
        await loadEnvelopesData({
          referenceMonth,
          page,
          size: pageSize,
          search,
          status: statusFilter,
          type: typeFilter || undefined,
        });
      }
    } catch {
      setError(t("envelopes.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function onArchive() {
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
        referenceMonth,
        accessToken,
      );
      setSelectedId(archived.id);
      await loadEnvelopesData({
        referenceMonth,
        page,
        size: pageSize,
        search,
        status: statusFilter,
        type: typeFilter || undefined,
      });
    } catch {
      setError(t("envelopes.archiveError"));
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
    setSelectedId(null);
    setError(null);
  }

  function handleCloseDrawer() {
    setIsCreating(false);
    setSelectedId(null);
    setSelectedEnvelope(null);
    setCategoryBreakdown([]);
    setError(null);
  }

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const rangeStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const rangeEnd =
    totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);
  const hasPreviousPage = page > 0;
  const hasNextPage = page + 1 < totalPages;

  return (
    <AppShell
      title={t("envelopes.title")}
      subtitle={t("envelopes.subtitle")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("envelopes.new")}
        </Button>
      }
    >
      {showInitialLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label={t("envelopes.loading")} />
        </Card>
      ) : (
        <section className={styles.stack}>
          <Card className={styles.toolbarPanel}>
            <div className={styles.toolbar}>
              <div className={styles.filterGroup}>
                <Field
                  htmlFor="envelope-reference-month"
                  label={t("common.month")}
                >
                  <Input
                    id="envelope-reference-month"
                    onChange={(event) => {
                      setReferenceMonth(
                        fromMonthInputValue(event.target.value),
                      );
                      setPage(0);
                    }}
                    type="month"
                    value={toMonthInputValue(referenceMonth)}
                  />
                </Field>

                <Field htmlFor="envelope-search" label={t("common.search")}>
                  <Input
                    id="envelope-search"
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(0);
                    }}
                    placeholder={t("envelopes.searchPlaceholder")}
                    value={search}
                  />
                </Field>

                <Field
                  htmlFor="envelope-status-filter"
                  label={t("common.status")}
                >
                  <Select
                    id="envelope-status-filter"
                    onChange={(event) => {
                      setStatusFilter(
                        event.target.value as "ALL" | "ACTIVE" | "ARCHIVED",
                      );
                      setPage(0);
                    }}
                    value={statusFilter}
                  >
                    <option value="ALL">{t("common.all")}</option>
                    <option value="ACTIVE">{t("common.active")}</option>
                    <option value="ARCHIVED">{t("common.archived")}</option>
                  </Select>
                </Field>

                <Field htmlFor="envelope-type-filter" label={t("common.type")}>
                  <Select
                    id="envelope-type-filter"
                    onChange={(event) => {
                      setTypeFilter(event.target.value as "" | EnvelopeType);
                      setPage(0);
                    }}
                    value={typeFilter}
                  >
                    <option value="">{t("common.allTypes")}</option>
                    <option value="GLOBAL">{t("envelopeTypes.GLOBAL")}</option>
                    <option value="ALLOWANCE">
                      {t("envelopeTypes.ALLOWANCE")}
                    </option>
                  </Select>
                </Field>
              </div>
            </div>
          </Card>

          <section className={styles.envelopeGrid}>
            {envelopes.length === 0 ? (
              <Card className={styles.emptyState}>
                <p>{t("envelopes.empty")}</p>
              </Card>
            ) : (
              envelopes.map((envelope) => (
                <Card key={envelope.id} className={styles.envelopeCard}>
                  <button
                    className={styles.envelopeButton}
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedId(envelope.id);
                      setError(null);
                    }}
                    type="button"
                  >
                    <div className={styles.envelopeHeader}>
                      <div>
                        <strong>{envelope.name}</strong>
                        <p className={styles.envelopeMeta}>
                          {envelope.type === "ALLOWANCE" &&
                          envelope.ownerMemberName
                            ? t("envelopes.allowanceFor", {
                                name: envelope.ownerMemberName,
                              })
                            : t("envelopes.linkedCategories", {
                                count: envelope.categories.length,
                              })}
                        </p>
                      </div>
                      <strong>
                        {formatCurrency(envelope.remainingAmount)}
                      </strong>
                    </div>

                    <div className={styles.badgeRow}>
                      <span className={styles.badge}>
                        {t(`envelopeTypes.${envelope.type}` as const)}
                      </span>
                      <span
                        className={
                          envelope.archivedFromMonth
                            ? `${styles.badge} ${styles.badgeMuted}`
                            : `${styles.badge} ${styles.badgeSuccess}`
                        }
                      >
                        {envelope.archivedFromMonth
                          ? t("envelopes.archivedFrom", {
                              month: formatReferenceMonth(
                                envelope.archivedFromMonth,
                              ),
                            })
                          : t("common.active")}
                      </span>
                    </div>
                  </button>
                </Card>
              ))
            )}
          </section>

          <Card className={styles.footerPanel}>
            <div className={styles.footer}>
              <span className={styles.rangeLabel}>
                {t("common.range", {
                  start: rangeStart,
                  end: rangeEnd,
                  total: totalItems,
                })}
              </span>

              <div className={styles.paginationControls}>
                <label className={styles.rowsControl}>
                  <span>{t("common.rows")}</span>
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
                    {t("common.previous")}
                  </Button>
                  <Button
                    disabled={!hasNextPage}
                    onClick={() => setPage((current) => current + 1)}
                    type="button"
                    variant="secondary"
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {isCreating || selectedEnvelopeSummary ? (
            <Drawer
              description={
                isCreating
                  ? t("envelopes.newDescription")
                  : t("envelopes.editDescription", {
                      month: formatReferenceMonth(referenceMonth),
                    })
              }
              onClose={handleCloseDrawer}
              title={
                isCreating
                  ? t("envelopes.newTitle")
                  : t("envelopes.detailsTitle")
              }
            >
              <div className={styles.drawerStack}>
                <form
                  className={styles.form}
                  onSubmit={form.handleSubmit(onSubmit)}
                  noValidate
                >
                  <Field
                    error={form.formState.errors.name?.message}
                    htmlFor="envelope-name"
                    label={t("common.name")}
                  >
                    <Input
                      id="envelope-name"
                      hasError={Boolean(form.formState.errors.name)}
                      {...form.register("name")}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.type?.message}
                    htmlFor="envelope-type"
                    label={t("common.type")}
                  >
                    <Select
                      id="envelope-type"
                      hasError={Boolean(form.formState.errors.type)}
                      {...form.register("type")}
                    >
                      <option value="GLOBAL">
                        {t("envelopeTypes.GLOBAL")}
                      </option>
                      <option value="ALLOWANCE">
                        {t("envelopeTypes.ALLOWANCE")}
                      </option>
                    </Select>
                  </Field>

                  <Field
                    error={form.formState.errors.monthlyLimit?.message}
                    htmlFor="envelope-monthly-limit"
                    label={t("envelopes.monthlyLimit")}
                  >
                    <Controller
                      control={form.control}
                      name="monthlyLimit"
                      render={({ field }) => (
                        <CurrencyInput
                          hasError={Boolean(form.formState.errors.monthlyLimit)}
                          id="envelope-monthly-limit"
                          onBlur={field.onBlur}
                          onValueChange={field.onChange}
                          ref={field.ref}
                          value={field.value}
                        />
                      )}
                    />
                  </Field>

                  {envelopeType === "ALLOWANCE" ? (
                    <Field
                      error={form.formState.errors.ownerMemberId?.message}
                      htmlFor="envelope-owner-member"
                      label={t("envelopes.ownerMember")}
                    >
                      <Select
                        id="envelope-owner-member"
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
                    <div className={styles.sectionBlock}>
                      <span className={styles.sectionTitle}>
                        {t("envelopes.linkedCategoriesTitle")}
                      </span>
                      <div className={styles.checkboxGroup}>
                        <div className={styles.checkboxList}>
                          {categoryOptions.map((category) => (
                            <Checkbox
                              key={category.id}
                              checked={selectedCategoryIds.includes(
                                category.id,
                              )}
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
                          {t("envelopes.globalHelper")}
                        </p>
                      </div>
                      {form.formState.errors.categoryIds?.message ? (
                        <FormError>
                          {form.formState.errors.categoryIds.message}
                        </FormError>
                      ) : null}
                    </div>
                  )}

                  <FormError>{error}</FormError>

                  <div className={styles.formActions}>
                    <Button loading={isSaving} type="submit">
                      {isCreating
                        ? t("envelopes.create")
                        : t("common.saveChanges")}
                    </Button>
                    {isCreating ? (
                      <Button
                        onClick={handleCancelCreate}
                        type="button"
                        variant="secondary"
                      >
                        {t("common.cancel")}
                      </Button>
                    ) : null}
                  </div>
                </form>

                {!isCreating ? (
                  <Card className={styles.detailPanel}>
                    <div className={styles.detailHeader}>
                      <h3 className={styles.detailTitle}>
                        {t("envelopes.currentImpact")}
                      </h3>
                      <p className={styles.detailSubtitle}>
                        {t("envelopes.currentImpactSubtitle", {
                          month: formatReferenceMonth(referenceMonth),
                        })}
                      </p>
                    </div>

                    {isDetailLoading ? (
                      <Spinner label={t("envelopes.loadingDetails")} />
                    ) : selectedEnvelope ? (
                      <div className={styles.detailSection}>
                        <section className={styles.summaryGrid}>
                          <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>
                              {t("envelopes.limit")}
                            </span>
                            <strong className={styles.summaryValue}>
                              {formatCurrency(selectedEnvelope.monthlyLimit)}
                            </strong>
                          </div>
                          <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>
                              {t("envelopes.consumed")}
                            </span>
                            <strong className={styles.summaryValue}>
                              {formatCurrency(selectedEnvelope.consumedAmount)}
                            </strong>
                          </div>
                          <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>
                              {t("envelopes.remaining")}
                            </span>
                            <strong className={styles.summaryValue}>
                              {formatCurrency(selectedEnvelope.remainingAmount)}
                            </strong>
                          </div>
                        </section>

                        <section className={styles.sectionBlock}>
                          <h4 className={styles.sectionTitle}>
                            {t("envelopes.categoryBreakdown")}
                          </h4>
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
                            <div className={styles.emptyStateInline}>
                              {t("envelopes.noCategoryConsumption")}
                            </div>
                          )}
                        </section>

                        <section className={styles.sectionBlock}>
                          <h4 className={styles.sectionTitle}>
                            {t("envelopes.matchedTransactions")}
                          </h4>
                          {selectedEnvelope.transactions.length > 0 ? (
                            <div className={styles.transactionList}>
                              {selectedEnvelope.transactions.map(
                                (transaction) => (
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
                                ),
                              )}
                            </div>
                          ) : (
                            <div className={styles.emptyStateInline}>
                              {t("envelopes.noMatchedTransactions")}
                            </div>
                          )}
                        </section>

                        <section className={styles.sectionBlock}>
                          <h4 className={styles.sectionTitle}>
                            {t("envelopes.linkedCategoriesTitle")}
                          </h4>
                          {selectedEnvelope.categories.length > 0 ? (
                            <div className={styles.categoryList}>
                              {selectedEnvelope.categories.map((category) => (
                                <span
                                  key={category.id}
                                  className={styles.badge}
                                >
                                  {category.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className={styles.emptyStateInline}>
                              {t("envelopes.noSharedCategories")}
                            </div>
                          )}
                        </section>
                      </div>
                    ) : (
                      <p className={styles.detailSubtitle}>
                        {t("envelopes.selectToReview")}
                      </p>
                    )}
                  </Card>
                ) : null}

                {!isCreating && selectedEnvelopeSummary ? (
                  <Card className={styles.archivePanel}>
                    <div className={styles.archiveHeader}>
                      <h3 className={styles.detailTitle}>
                        {t("envelopes.archiveTitle")}
                      </h3>
                      <p className={styles.detailSubtitle}>
                        {t("envelopes.archiveSubtitle")}
                      </p>
                    </div>

                    <div className={styles.form}>
                      <p className={styles.detailSubtitle}>
                        O arquivamento passa a valer automaticamente para o mês exibido: {formatReferenceMonth(referenceMonth)}.
                      </p>

                      <Button
                        disabled={Boolean(
                          selectedEnvelopeSummary.archivedFromMonth,
                        )}
                        loading={isArchiving}
                        onClick={() => void onArchive()}
                        type="button"
                        variant="secondary"
                      >
                        {selectedEnvelopeSummary.archivedFromMonth
                          ? t("envelopes.archived")
                          : t("envelopes.archiveAction")}
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
