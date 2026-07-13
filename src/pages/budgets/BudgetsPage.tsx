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
import type { BudgetFormValues } from "../../lib/validation/budgetSchema";
import BudgetList from "./BudgetList";
import BudgetForm from "./BudgetForm";
import styles from "./BudgetsPage.module.scss";

export default function BudgetsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const initialReferenceMonth = useMemo(() => getCurrentReferenceMonth(), []);
  const [referenceMonth, setReferenceMonth] = useState(initialReferenceMonth);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ACTIVE");
  const [typeFilter, setTypeFilter] = useState<BudgetType | "ALL">("ALL");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [referenceData, setReferenceData] = useState<{
    categories: CategoryOption[];
    members: FamilyMember[];
  }>({ categories: [], members: [] });

  function handleSelect(id: string, budget: Budget) {
    setIsCreating(false);
    setSelectedId(id);
    setSelectedBudget(budget);
  }

  function handleStartCreate() {
    setIsCreating(true);
    setSelectedId(null);
    setSelectedBudget(null);
  }

  function handleCloseDrawer() {
    setIsCreating(false);
    setSelectedId(null);
    setSelectedBudget(null);
  }

  function handleFormSuccess() {
    setIsCreating(false);
    setSelectedId(null);
    setSelectedBudget(null);
    setRefreshKey((k) => k + 1);
  }

  const initialValues = useMemo<BudgetFormValues | null>(() => {
    if (isCreating || !selectedBudget) {
      return null;
    }
    return {
      name: selectedBudget.name,
      type: selectedBudget.type,
      ownerMemberId: selectedBudget.ownerMemberId ?? "",
      categoryIds: selectedBudget.categories.map((c) => c.id),
      monthlyLimit: selectedBudget.monthlyLimit,
    };
  }, [isCreating, selectedBudget]);

  const activeFilters = useMemo(
    () => [
      ...(search
        ? [
            {
              key: "search",
              label: `${t("common.search")}: ${search}`,
              onRemove: () => {
                setSearch("");
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
              },
            },
          ]
        : []),
      ...(typeFilter !== "ALL"
        ? [
            {
              key: "type",
              label: `${t("common.type")}: ${t(`budgetTypes.${typeFilter}`)}`,
              onRemove: () => {
                setTypeFilter("ALL");
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
    setTypeFilter("ALL");
  }

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
                      setReferenceMonth(newMonth);
                    }}
                    value={referenceMonth}
                  />
                </Field>
                <Field htmlFor="budget-search" label={t("common.search")}>
                  {" "}
                  <Input
                    id="budget-search"
                    onChange={(event) => {
                      setSearch(event.target.value);
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
                      setTypeFilter(event.target.value as BudgetType | "ALL");
                    }}
                    value={typeFilter}
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
          search={search}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          referenceMonth={referenceMonth}
          selectedId={selectedId}
          onSelect={handleSelect}
          refreshKey={refreshKey}
          onReferenceDataLoaded={setReferenceData}
        />

        {isCreating || selectedBudget ? (
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
                initialValues={initialValues}
                budget={selectedBudget}
                user={user!}
                categories={referenceData.categories}
                members={referenceData.members}
                referenceMonth={referenceMonth}
                onSuccess={handleFormSuccess}
                onCancel={handleCloseDrawer}
              />
            </div>
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
