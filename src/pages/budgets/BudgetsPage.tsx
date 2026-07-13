import { useMemo, useState } from "react";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import MonthSelector from "../../components/ui/MonthSelector";
import Input from "../../components/ui/Input";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import Select from "../../components/ui/Select";
import {
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import { useI18n } from "../../app/i18n/I18nContext";
import type { Budget, BudgetType } from "../../app/api/budgets";
import type { CategoryOption } from "../../app/api/categories";
import type { FamilyMember } from "../../app/api/family";
import BudgetList from "./BudgetList";
import BudgetForm from "./BudgetForm";
import styles from "./BudgetsPage.module.scss";

type BudgetFilters = {
  search: string;
  status: "ALL" | "ACTIVE" | "ARCHIVED";
  type: BudgetType | "ALL";
  referenceMonth: string;
};

const initialRefMonth = getCurrentReferenceMonth();
const DEFAULT_FILTERS: BudgetFilters = {
  search: "",
  status: "ACTIVE",
  type: "ALL",
  referenceMonth: initialRefMonth,
};

export default function BudgetsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [filters, setFilters] = useState<BudgetFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [referenceData, setReferenceData] = useState<{
    categories: CategoryOption[];
    members: FamilyMember[];
  }>({ categories: [], members: [] });

  function handleSelect(id: string, budget: Budget) {
    setSelectedId(id);
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
    () => [
      ...(filters.search
        ? [
            {
              key: "search",
              label: `${t("common.search")}: ${filters.search}`,
              onRemove: () => {
                setFilters((c) => ({ ...c, search: "" }));
              },
            },
          ]
        : []),
      ...(filters.status !== "ACTIVE"
        ? [
            {
              key: "status",
              label: `${t("common.status")}: ${t(
                filters.status === "ALL" ? "common.all" : "common.archived",
              )}`,
              onRemove: () => {
                setFilters((c) => ({ ...c, status: "ACTIVE" }));
              },
            },
          ]
        : []),
      ...(filters.type !== "ALL"
        ? [
            {
              key: "type",
              label: `${t("common.type")}: ${t(`budgetTypes.${filters.type}`)}`,
              onRemove: () => {
                setFilters((c) => ({ ...c, type: "ALL" }));
              },
            },
          ]
        : []),
    ],
    [filters.search, filters.status, filters.type, t],
  );

  function clearFilters() {
    setFilters((c) => ({
      ...DEFAULT_FILTERS,
      referenceMonth: c.referenceMonth,
    }));
  }

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
                      setFilters((c) => ({ ...c, referenceMonth: newMonth }));
                    }}
                    value={filters.referenceMonth}
                  />
                </Field>
                <Field htmlFor="budget-search" label={t("common.search")}>
                  {" "}
                  <Input
                    id="budget-search"
                    onChange={(event) => {
                      setFilters((c) => ({ ...c, search: event.target.value }));
                    }}
                    placeholder={t("budgets.searchPlaceholder")}
                    value={filters.search}
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
                      setFilters((c) => ({
                        ...c,
                        status: event.target.value as
                          "ALL" | "ACTIVE" | "ARCHIVED",
                      }));
                    }}
                    value={filters.status}
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
                      setFilters((c) => ({
                        ...c,
                        type: event.target.value as BudgetType | "ALL",
                      }));
                    }}
                    value={filters.type}
                  >
                    <option value="ALL">{t("common.allTypes")}</option>
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
