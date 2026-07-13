import { useMemo, useState } from "react";
import type { AccountOption } from "../../app/api/accounts";
import type { CategoryOption } from "../../app/api/categories";
import type { FixedExpenseTemplate } from "../../app/api/fixedExpenses";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { getCurrentReferenceMonth } from "../../lib/formatters/date";
import { useI18n } from "../../app/i18n/I18nContext";
import { ACTIVE_STATUS_FILTER, type StatusFilter } from "../../lib/constants";
import {
  buildSearchActiveFilter,
  buildStatusActiveFilter,
  compileActiveFilters,
} from "../../lib/activeFilters";
import { useFiltersState } from "../../lib/useFiltersState";
import FixedExpenseList from "./FixedExpenseList";
import FixedExpenseForm from "./FixedExpenseForm";
import styles from "./FixedExpensesPage.module.scss";

type FixedExpenseFilters = { search: string; status: StatusFilter };
const DEFAULT_FILTERS: FixedExpenseFilters = {
  search: "",
  status: ACTIVE_STATUS_FILTER,
};

export default function FixedExpensesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const referenceMonth = getCurrentReferenceMonth();
  const { filters, patchFilters, clearFilter, resetFilters } =
    useFiltersState(DEFAULT_FILTERS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<FixedExpenseTemplate | null>(null);

  function handleSelect(_id: string, template: FixedExpenseTemplate) {
    setSelectedId(template.id);
    setSelectedTemplate(template);
    setShowDrawer(true);
  }

  function handleStartCreate() {
    setSelectedId(null);
    setSelectedTemplate(null);
    setShowDrawer(true);
  }

  function handleCloseDrawer() {
    setSelectedId(null);
    setSelectedTemplate(null);
    setShowDrawer(false);
  }

  function handleSuccess() {
    handleCloseDrawer();
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
      ]),
    [filters, t, clearFilter],
  );

  const isCreating = selectedId === null;
  const isDrawerOpen = showDrawer;

  return (
    <AppShell
      title={t("fixedTransactions.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("fixedTransactions.new")}
        </Button>
      }
    >
      <section className={styles.stack}>
        <Card className={styles.toolbarPanel}>
          <FilterToolbar
            activeFilters={activeFilters}
            isPanelOpen={isFiltersOpen}
            onClearFilters={() => resetFilters()}
            onClosePanel={() => setIsFiltersOpen(false)}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
            primaryContent={
              <Field htmlFor="fixed-expense-search" label={t("common.search")}>
                <Input
                  id="fixed-expense-search"
                  onChange={(event) => {
                    patchFilters({ search: event.target.value });
                  }}
                  placeholder={t("fixedTransactions.searchPlaceholder")}
                  value={filters.search}
                />
              </Field>
            }
            secondaryContent={
              <>
                <Field
                  htmlFor="fixed-expense-status-filter"
                  label={t("common.status")}
                >
                  <Select
                    id="fixed-expense-status-filter"
                    onChange={(event) => {
                      patchFilters({
                        status: event.target.value as StatusFilter,
                      });
                    }}
                    value={filters.status}
                  >
                    <option value="ALL">{t("common.all")}</option>
                    <option value="ACTIVE">{t("common.active")}</option>
                    <option value="ARCHIVED">{t("common.archived")}</option>
                  </Select>
                </Field>
              </>
            }
          />
        </Card>

        <FixedExpenseList
          filters={filters}
          referenceMonth={referenceMonth}
          selectedId={selectedId}
          onSelect={handleSelect}
          refreshKey={refreshKey}
          onAccountOptionsLoaded={setAccountOptions}
          onCategoryOptionsLoaded={setCategoryOptions}
        />

        {isDrawerOpen ? (
          <Drawer
            description={
              isCreating
                ? t("fixedTransactions.newDescription")
                : t("fixedTransactions.editDescription")
            }
            onClose={handleCloseDrawer}
            title={
              isCreating
                ? t("fixedTransactions.newTitle")
                : t("fixedTransactions.detailsTitle")
            }
          >
            <FixedExpenseForm
              template={selectedTemplate}
              user={user!}
              accountOptions={accountOptions}
              categoryOptions={categoryOptions}
              onSuccess={handleSuccess}
              onCancel={handleCloseDrawer}
            />
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
