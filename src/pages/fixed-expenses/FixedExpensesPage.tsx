import { useMemo, useState } from "react";
import type { AccountOption } from "../../app/api/accounts";
import type { CategoryOption } from "../../app/api/categories";
import type { FixedExpenseTemplate } from "../../app/api/fixedExpenses";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import FilterToolbar from "../../components/ui/FilterToolbar";
import FilterSelectInput from "../../components/ui/filterFields/FilterSelectInput";
import FilterTextInput from "../../components/ui/filterFields/FilterTextInput";
import { getCurrentReferenceMonth } from "../../lib/formatters/date";
import { useI18n } from "../../app/i18n/I18nContext";
import { ACTIVE_STATUS_FILTER, type StatusFilter } from "../../lib/constants";
import type { FilterFields } from "../../lib/filterFields";
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
  const { filters, patchFilters, clearFilter } = useFiltersState(DEFAULT_FILTERS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FixedExpenseTemplate | null>(null);

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

  const fields = useMemo<FilterFields>(
    () => ({
      search: {
        kind: "text",
        label: t("common.search"),
        value: filters.search,
        defaultValue: "",
        placement: "visible",
        element: (
          <FilterTextInput
            id="fixed-expense-search"
            label={t("common.search")}
            onChange={(search) => {
              patchFilters({ search });
            }}
            placeholder={t("fixedTransactions.searchPlaceholder")}
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
            id="fixed-expense-status-filter"
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
    }),
    [filters.search, filters.status, patchFilters, t],
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
            fields={fields}
            isPanelOpen={isFiltersOpen}
            onClosePanel={() => setIsFiltersOpen(false)}
            onResetField={(name, defaultValue) => {
              clearFilter(name as keyof FixedExpenseFilters, defaultValue as FixedExpenseFilters[keyof FixedExpenseFilters]);
            }}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
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
            description={isCreating ? t("fixedTransactions.newDescription") : t("fixedTransactions.editDescription")}
            onClose={handleCloseDrawer}
            title={isCreating ? t("fixedTransactions.newTitle") : t("fixedTransactions.detailsTitle")}
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
