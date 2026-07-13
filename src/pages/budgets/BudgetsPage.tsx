import { useMemo, useState } from "react";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import FilterToolbar from "../../components/ui/FilterToolbar";
import FilterMonthInput from "../../components/ui/filterFields/FilterMonthInput";
import FilterSelectInput from "../../components/ui/filterFields/FilterSelectInput";
import FilterTextInput from "../../components/ui/filterFields/FilterTextInput";
import {
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import { useI18n } from "../../app/i18n/I18nContext";
import type { Budget, BudgetType } from "../../app/api/budgets";
import type { CategoryOption } from "../../app/api/categories";
import type { FamilyMember } from "../../app/api/family";
import { ACTIVE_STATUS_FILTER, type StatusFilter } from "../../lib/constants";
import type { FilterFields } from "../../lib/filterFields";
import { useFiltersState } from "../../lib/useFiltersState";
import BudgetList from "./BudgetList";
import BudgetForm from "./BudgetForm";
import styles from "./BudgetsPage.module.scss";

type BudgetFilters = {
  search: string;
  status: StatusFilter;
  type: BudgetType | "ALL";
  referenceMonth: string;
};

const initialRefMonth = getCurrentReferenceMonth();
const DEFAULT_FILTERS: BudgetFilters = {
  search: "",
  status: ACTIVE_STATUS_FILTER,
  type: "ALL",
  referenceMonth: initialRefMonth,
};

export default function BudgetsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { filters, patchFilters, clearFilter } =
    useFiltersState(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [referenceData, setReferenceData] = useState<{
    categories: CategoryOption[];
    members: FamilyMember[];
  }>({ categories: [], members: [] });

  function handleSelect(_id: string, budget: Budget) {
    setSelectedId(budget.id);
    setSelectedBudget(budget);
    setShowDrawer(true);
  }

  function handleStartCreate() {
    setSelectedId(null);
    setSelectedBudget(null);
    setShowDrawer(true);
  }

  function handleCloseDrawer() {
    setSelectedId(null);
    setSelectedBudget(null);
    setShowDrawer(false);
  }

  function handleSuccess() {
    setSelectedId(null);
    setSelectedBudget(null);
    setShowDrawer(false);
    setRefreshKey((k) => k + 1);
  }

  const fields = useMemo<FilterFields>(
    () => ({
      referenceMonth: {
        kind: "text",
        label: t("common.month"),
        value: filters.referenceMonth,
        defaultValue: filters.referenceMonth,
        placement: "visible",
        element: (
          <FilterMonthInput
            id="budget-reference-month"
            label={t("common.month")}
            onChange={(referenceMonth) => {
              patchFilters({ referenceMonth });
            }}
            value={filters.referenceMonth}
          />
        ),
      },
      search: {
        kind: "text",
        label: t("common.search"),
        value: filters.search,
        defaultValue: "",
        placement: "visible",
        element: (
          <FilterTextInput
            id="budget-search"
            label={t("common.search")}
            onChange={(search) => {
              patchFilters({ search });
            }}
            placeholder={t("budgets.searchPlaceholder")}
            value={filters.search}
          />
        ),
      },
      status: {
        kind: "select",
        label: t("common.status"),
        value: filters.status,
        defaultValue: ACTIVE_STATUS_FILTER,
        placement: "expanded",
        options: [
          { value: "ALL", label: t("common.all") },
          { value: "ACTIVE", label: t("common.active") },
          { value: "ARCHIVED", label: t("common.archived") },
        ],
        element: (
          <FilterSelectInput<StatusFilter>
            id="budget-status-filter"
            label={t("common.status")}
            onChange={(status) => {
              patchFilters({ status: status as StatusFilter });
            }}
            options={[
              { value: "ALL", label: t("common.all") },
              { value: "ACTIVE", label: t("common.active") },
              { value: "ARCHIVED", label: t("common.archived") },
            ]}
            placeholder={t("common.all")}
            value={filters.status}
          />
        ),
      },
      type: {
        kind: "select",
        label: t("common.type"),
        value: filters.type,
        defaultValue: "ALL",
        placement: "expanded",
        options: [
          { value: "GLOBAL", label: t("budgetTypes.GLOBAL") },
          { value: "ALLOWANCE", label: t("budgetTypes.ALLOWANCE") },
        ],
        element: (
          <FilterSelectInput<BudgetType | "ALL">
            id="budget-type-filter"
            label={t("common.type")}
            onChange={(type) => {
              patchFilters({ type: type as BudgetType | "ALL" });
            }}
            options={[
              { value: "GLOBAL", label: t("budgetTypes.GLOBAL") },
              { value: "ALLOWANCE", label: t("budgetTypes.ALLOWANCE") },
            ]}
            placeholder={t("common.allTypes")}
            value={filters.type}
          />
        ),
      },
    }),
    [
      filters.referenceMonth,
      filters.search,
      filters.status,
      filters.type,
      patchFilters,
      t,
    ],
  );

  const isCreating = selectedId === null;
  const isDrawerOpen = showDrawer;

  return (
    <AppShell
      title={t("budgets.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("budgets.new")}
        </Button>
      }
    >
      <section className={styles.stack}>
        <Card className={styles.toolbarPanel}>
          <FilterToolbar
            fields={fields}
            isPanelOpen={isFiltersOpen}
            onClosePanel={() => setIsFiltersOpen(false)}
            onResetField={(name, defaultValue) => {
              clearFilter(
                name as keyof BudgetFilters,
                defaultValue as BudgetFilters[keyof BudgetFilters],
              );
            }}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
          />
        </Card>

        <BudgetList
          filters={filters}
          selectedId={selectedId}
          onSelect={handleSelect}
          refreshKey={refreshKey}
          onReferenceDataLoaded={setReferenceData}
        />

        {isDrawerOpen ? (
          <Drawer
            description={
              isCreating
                ? t("budgets.newDescription")
                : t("budgets.editDescription", {
                    month: formatReferenceMonth(filters.referenceMonth),
                  })
            }
            onClose={handleCloseDrawer}
            title={
              isCreating ? t("budgets.newTitle") : t("budgets.detailsTitle")
            }
          >
            <div className={styles.drawerStack}>
              <BudgetForm
                budget={selectedBudget}
                user={user!}
                categories={referenceData.categories}
                members={referenceData.members}
                referenceMonth={filters.referenceMonth}
                onSuccess={handleSuccess}
                onCancel={handleCloseDrawer}
              />
            </div>
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
