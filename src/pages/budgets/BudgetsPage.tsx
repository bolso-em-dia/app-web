import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  listCategoryOptions,
  type CategoryOption,
} from "../../app/api/categories";
import { listFamilyMembers, type FamilyMember } from "../../app/api/family";
import {
  archiveBudget,
  createBudget,
  getBudget,
  listBudgetCategoryBreakdown,
  listBudgets,
  updateBudget,
  type Budget,
  type BudgetCategoryBreakdown,
  type BudgetListParams,
  type BudgetPayload,
  type BudgetType,
} from "../../app/api/budgets";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import MonthSelector from "../../components/ui/MonthSelector";
import Input from "../../components/ui/Input";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import Select from "../../components/ui/Select";
import PaginationBar from "../../components/ui/PaginationBar";
import {
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import {
  createBudgetSchema,
  type BudgetFormValues,
} from "../../lib/validation/budgetSchema";
import { useI18n } from "../../app/i18n/I18nContext";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";
import { usePagination } from "../../lib/usePagination";
import BudgetList from "./BudgetList";
import BudgetForm from "./BudgetForm";
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
    ownerMemberId:
      values.type === "ALLOWANCE" && values.ownerMemberId
        ? values.ownerMemberId
        : undefined,
    categoryIds: values.type === "GLOBAL" ? values.categoryIds : undefined,
    monthlyLimit: values.monthlyLimit,
  };
}

export default function BudgetsPage() {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const initialReferenceMonth = useMemo(() => getCurrentReferenceMonth(), []);
  const [referenceMonth, setReferenceMonth] = useState(initialReferenceMonth);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    BudgetCategoryBreakdown[]
  >([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ACTIVE");
  const [typeFilter, setTypeFilter] = useState<"" | BudgetType>("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBudgetSummary = useMemo(
    () => budgets.find((budget) => budget.id === selectedId) ?? null,
    [budgets, selectedId],
  );

  const budgetSchema = useMemo(() => createBudgetSchema(t), [t]  );
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const budgetType = form.watch("type");

  const availableAllowanceMembers = useMemo(
    () => members.filter((member) => member.active && member.allowanceEnabled),
    [members],
  );

  const loadBudgetsData = useCallback(
    async (params: BudgetListParams) => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [budgetsResponse, categoryOptionsResponse, membersResponse] =
          await Promise.all([
            listBudgets(params, accessToken),
            listCategoryOptions(params.referenceMonth, accessToken),
            listFamilyMembers(accessToken),
          ]);

        setBudgets(budgetsResponse.items);
        setPage(budgetsResponse.page);
        setPageSize(budgetsResponse.size);
        setTotalItems(budgetsResponse.totalItems);
        setCategoryOptions(categoryOptionsResponse);
        setMembers(membersResponse);
        setSelectedId((current) =>
          current &&
          budgetsResponse.items.some((budget) => budget.id === current)
            ? current
            : null,
        );
      } catch {
        setError(t("budgets.error"));
      } finally {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [accessToken, t],
  );

  const loadBudgetDetails = useCallback(async () => {
    if (!accessToken || !selectedId || isCreating) {
      setSelectedBudget(null);
      setCategoryBreakdown([]);
      return;
    }

    setIsDetailLoading(true);

    try {
      const [budgetResponse, categoryBreakdownResponse] = await Promise.all([
        getBudget(selectedId, referenceMonth, accessToken),
        listBudgetCategoryBreakdown(selectedId, referenceMonth, accessToken),
      ]);
      setSelectedBudget(budgetResponse);
      setCategoryBreakdown(categoryBreakdownResponse);
      form.reset({
        name: budgetResponse.name,
        type: budgetResponse.type,
        ownerMemberId: budgetResponse.ownerMemberId ?? "",
        categoryIds: budgetResponse.categories.map((c) => c.id),
        monthlyLimit: budgetResponse.monthlyLimit,
      });
    } catch {
      setError(t("budgets.detailsError"));
      setSelectedBudget(null);
      setCategoryBreakdown([]);
    } finally {
      setIsDetailLoading(false);
    }
  }, [accessToken, isCreating, referenceMonth, selectedId, t]);

  useEffect(() => {
    void loadBudgetsData({
      referenceMonth,
      page,
      size: pageSize,
      search,
      status: statusFilter,
      type: typeFilter || undefined,
    });
  }, [
    loadBudgetsData,
    page,
    pageSize,
    referenceMonth,
    search,
    statusFilter,
    typeFilter,
  ]);

  useEffect(() => {
    void loadBudgetDetails();
  }, [loadBudgetDetails]);

  async function onSubmit(values: BudgetFormValues) {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        await createBudget(mapFormValuesToPayload(values), accessToken);
        handleCloseDrawer();
        await loadBudgetsData({
          referenceMonth,
          page,
          size: pageSize,
          search,
          status: statusFilter,
          type: typeFilter || undefined,
        });
      } else if (selectedBudgetSummary) {
        await updateBudget(
          selectedBudgetSummary.id,
          mapFormValuesToPayload(values),
          accessToken,
        );
        handleCloseDrawer();
        await loadBudgetsData({
          referenceMonth,
          page,
          size: pageSize,
          search,
          status: statusFilter,
          type: typeFilter || undefined,
        });
      }
    } catch {
      setError(t("budgets.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function onArchive() {
    if (
      !accessToken ||
      !selectedBudgetSummary ||
      selectedBudgetSummary.archivedFromMonth
    ) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      const archived = await archiveBudget(
        selectedBudgetSummary.id,
        referenceMonth,
        accessToken,
      );
      setSelectedId(archived.id);
      await loadBudgetsData({
        referenceMonth,
        page,
        size: pageSize,
        search,
        status: statusFilter,
        type: typeFilter || undefined,
      });
    } catch {
      setError(t("budgets.archiveError"));
    } finally {
      setIsArchiving(false);
    }
  }

  function handleStartCreate() {
    setIsCreating(true);
    setSelectedId(null);
    setSelectedBudget(null);
    setCategoryBreakdown([]);
    setError(null);
    form.reset(DEFAULT_VALUES);
  }

  function handleCancelCreate() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
    form.reset(DEFAULT_VALUES);
  }

  function handleCloseDrawer() {
    setIsCreating(false);
    setSelectedId(null);
    setSelectedBudget(null);
    setCategoryBreakdown([]);
    setError(null);
    form.reset(DEFAULT_VALUES);
  }

  const activeFilters = useMemo(
    () => [
      ...(search
        ? [
            {
              key: "search",
              label: `${t("common.search")}: ${search}`,
              onRemove: () => {
                setSearch("");
                setPage(0);
              },
            },
          ]
        : []),
      ...(statusFilter !== "ACTIVE"
        ? [
            {
              key: "status",
              label: `${t("common.status")}: ${t(
                statusFilter === "ALL" ? "common.all" : "common.archived",
              )}`,
              onRemove: () => {
                setStatusFilter("ACTIVE");
                setPage(0);
              },
            },
          ]
        : []),
      ...(typeFilter
        ? [
            {
              key: "type",
              label: `${t("common.type")}: ${t(`budgetTypes.${typeFilter}`)}`,
              onRemove: () => {
                setTypeFilter("");
                setPage(0);
              },
            },
          ]
        : []),
    ],
    [search, statusFilter, t, typeFilter],
  );

  function clearFilters() {
    setSearch("");
    setStatusFilter("ACTIVE");
    setTypeFilter("");
    setPage(0);
  }

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const pagination = usePagination(page, pageSize, totalItems, totalPages);

  return (
    <AppShell
      title={t("budgets.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("budgets.new")}
        </Button>
      }
    >
      {showInitialLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label={t("budgets.loading")} />
        </Card>
      ) : (
        <section className={styles.stack}>
          <Card className={styles.toolbarPanel}>
            <FilterToolbar
              activeFilters={activeFilters}
              isPanelOpen={isFiltersOpen}
              onClearFilters={clearFilters}
              onClosePanel={() => setIsFiltersOpen(false)}
              onTogglePanel={() => setIsFiltersOpen((current) => !current)}
              primaryContent={
                <>
                  <Field
                    htmlFor="budget-reference-month"
                    label={t("common.month")}
                  >
                    <MonthSelector
                      id="budget-reference-month"
                      onChange={(newMonth) => {
                        setReferenceMonth(newMonth);
                        setPage(0);
                      }}
                      value={referenceMonth}
                    />
                  </Field>
                  <Field htmlFor="budget-search" label={t("common.search")}>                     <Input
                      id="budget-search"
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(0);
                      }}
                      placeholder={t("budgets.searchPlaceholder")}
                      value={search}
                    />
                  </Field>
                </>
              }
              secondaryContent={
                <>
                  <Field
                    htmlFor="budget-status-filter"
                    label={t("common.status")}
                  >
                    <Select
                      id="budget-status-filter"
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

                  <Field htmlFor="budget-type-filter" label={t("common.type")}>
                    <Select
                      id="budget-type-filter"
                      onChange={(event) => {
                        setTypeFilter(event.target.value as "" | BudgetType);
                        setPage(0);
                      }}
                      value={typeFilter}
                    >
                      <option value="">{t("common.allTypes")}</option>
                      <option value="GLOBAL">{t("budgetTypes.GLOBAL")}</option>
                      <option value="ALLOWANCE">
                        {t("budgetTypes.ALLOWANCE")}
                      </option>
                    </Select>
                  </Field>
                </>
              }
            />
          </Card>

          <BudgetList
            budgets={budgets}
            selectedId={selectedId}
            emptyMessage={t("budgets.empty")}
            onCardSelect={(id, budget) => {
              setIsCreating(false);
              setSelectedId(id);
              setSelectedBudget(budget);
              setError(null);
              form.reset({
                name: budget.name,
                type: budget.type,
                ownerMemberId: budget.ownerMemberId ?? "",
                categoryIds: budget.categories.map((c) => c.id),
                monthlyLimit: budget.monthlyLimit,
              });
            }}
          />

          <PaginationBar
            start={pagination.rangeStart}
            end={pagination.rangeEnd}
            total={totalItems}
            pageSize={pageSize}
            hasPrevious={pagination.hasPreviousPage}
            hasNext={pagination.hasNextPage}
            onPrevious={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(0);
            }}
          />

          {isCreating || selectedBudgetSummary ? (
            <Drawer
              description={
                isCreating
                  ? t("budgets.newDescription")
                  : t("budgets.editDescription", {
                      month: formatReferenceMonth(referenceMonth),
                    })
              }
              onClose={handleCloseDrawer}
              title={
                isCreating ? t("budgets.newTitle") : t("budgets.detailsTitle")
              }
            >
              <div className={styles.drawerStack}>
                <BudgetForm
                  availableAllowanceMembers={availableAllowanceMembers}
                  categoryOptions={categoryOptions}
                  error={error}
                  form={form}
                  isArchiveConfirmOpen={isArchiveConfirmOpen}
                  isArchiving={isArchiving}
                  isCreating={isCreating}
                  isSaving={isSaving}
                  onCancelCreate={handleCancelCreate}
                  onArchiveCancel={() => setIsArchiveConfirmOpen(false)}
                  onArchiveConfirm={() => {
                    setIsArchiveConfirmOpen(false);
                    void onArchive();
                  }}
                  onArchiveOpen={() => setIsArchiveConfirmOpen(true)}
                  onSubmit={onSubmit}
                  selectedBudgetSummary={selectedBudgetSummary}
                />
              </div>
            </Drawer>
          ) : null}
        </section>
      )}
    </AppShell>
  );
}
