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
import type { FixedExpenseFormValues } from "../../lib/validation/fixedExpenseSchema";
import { useI18n } from "../../app/i18n/I18nContext";
import type { StatusFilter } from "../../lib/constants";
import type { TransactionType } from "../../app/api/transactions";
import FixedExpenseList from "./FixedExpenseList";
import FixedExpenseForm from "./FixedExpenseForm";
import styles from "./FixedExpensesPage.module.scss";

export default function FixedExpensesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const referenceMonth = getCurrentReferenceMonth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [typeFilter] = useState<TransactionType | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialValues, setInitialValues] =
    useState<FixedExpenseFormValues | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  function handleSelect(id: string, template: FixedExpenseTemplate) {
    setIsCreating(false);
    setSelectedId(id);
    setInitialValues({
      name: template.name,
      type: template.type,
      amount: template.amount,
      categoryId: template.categoryId,
      accountId: template.accountId,
      dueDay: template.dueDay,
    });
  }

  function handleStartCreate() {
    setIsCreating(true);
    setSelectedId(null);
    setInitialValues(null);
  }

  function handleCloseDrawer() {
    setIsCreating(false);
    setSelectedId(null);
    setInitialValues(null);
  }

  function handleSuccess() {
    handleCloseDrawer();
    setRefreshKey((k) => k + 1);
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
    ],
    [search, statusFilter, t],
  );

  function clearFilters() {
    setSearch("");
    setStatusFilter("ACTIVE");
  }

  const drawerOpen = isCreating || selectedId !== null;

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
            onClearFilters={clearFilters}
            onClosePanel={() => setIsFiltersOpen(false)}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
            primaryContent={
              <Field htmlFor="fixed-expense-search" label={t("common.search")}>
                <Input
                  id="fixed-expense-search"
                  onChange={(event) => {
                    setSearch(event.target.value);
                  }}
                  placeholder={t("fixedTransactions.searchPlaceholder")}
                  value={search}
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
                      setStatusFilter(event.target.value as StatusFilter);
                    }}
                    value={statusFilter}
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
          search={search}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          referenceMonth={referenceMonth}
          selectedId={selectedId}
          onSelect={handleSelect}
          refreshKey={refreshKey}
          onAccountOptionsLoaded={setAccountOptions}
          onCategoryOptionsLoaded={setCategoryOptions}
        />

        {drawerOpen ? (
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
              initialValues={initialValues}
              editingId={selectedId}
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
