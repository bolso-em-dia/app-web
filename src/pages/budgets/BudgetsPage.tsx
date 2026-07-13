import { useMemo, useState } from "react";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import FilterToolbar from "../../components/ui/FilterToolbar";
import {
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import { useI18n } from "../../app/i18n/I18nContext";
import type { Budget, BudgetType } from "../../app/api/budgets";
import type { CategoryOption } from "../../app/api/categories";
import type { FamilyMember } from "../../app/api/family";
import { ACTIVE_STATUS_FILTER, type StatusFilter } from "../../lib/constants";
import {
  buildSearchActiveFilter,
  buildStatusActiveFilter,
  buildTypeActiveFilter,
  compileActiveFilters,
} from "../../lib/activeFilters";
import { useFiltersState } from "../../lib/useFiltersState";
import BudgetList from "./BudgetList";
import BudgetForm from "./BudgetForm";
import {
  BudgetFiltersPrimary,
  BudgetFiltersSecondary,
} from "./BudgetFiltersContent";
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
  const { filters, patchFilters, clearFilter, resetFilters } =
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

  const activeFilters = useMemo(
    () =>
      compileActiveFilters([
        buildSearchActiveFilter(filters.search, t("common.search"), () => {
          clearFilter("search", "");
        }),
        buildStatusActiveFilter(filters.status, t, () => {
          clearFilter("status", ACTIVE_STATUS_FILTER);
        }),
        buildTypeActiveFilter(
          "type",
          filters.type === "ALL" ? undefined : filters.type,
          filters.type !== "ALL"
            ? `${t("common.type")}: ${t(`budgetTypes.${filters.type}` as const)}`
            : "",
          () => {
            clearFilter("type", "ALL" as BudgetType | "ALL");
          },
        ),
      ]),
    [filters.search, filters.status, filters.type, t, clearFilter],
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
            activeFilters={activeFilters}
            isPanelOpen={isFiltersOpen}
            onClearFilters={() =>
              resetFilters({
                ...DEFAULT_FILTERS,
                referenceMonth: filters.referenceMonth,
              })
            }
            onClosePanel={() => setIsFiltersOpen(false)}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
            primaryContent={
              <BudgetFiltersPrimary
                filters={filters}
                onFiltersChange={patchFilters}
              />
            }
            secondaryContent={
              <BudgetFiltersSecondary
                filters={filters}
                onFiltersChange={patchFilters}
              />
            }
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
