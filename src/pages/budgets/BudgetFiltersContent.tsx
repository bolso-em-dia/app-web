import type { BudgetType } from "../../app/api/budgets";
import { type StatusFilter } from "../../lib/constants";
import { useI18n } from "../../app/i18n/I18nContext";
import Field from "../../components/ui/Field";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import MonthSelector from "../../components/ui/MonthSelector";

type BudgetFilters = {
  search: string;
  status: StatusFilter;
  type: BudgetType | "ALL";
  referenceMonth: string;
};

type BudgetFiltersContentProps = {
  filters: BudgetFilters;
  onFiltersChange: (partial: Partial<BudgetFilters>) => void;
};

export function BudgetFiltersPrimary({
  filters,
  onFiltersChange,
}: BudgetFiltersContentProps) {
  const { t } = useI18n();

  return (
    <>
      <Field htmlFor="budget-reference-month" label={t("common.month")}>
        <MonthSelector
          id="budget-reference-month"
          onChange={(newMonth) => {
            onFiltersChange({ referenceMonth: newMonth });
          }}
          value={filters.referenceMonth}
        />
      </Field>
      <Field htmlFor="budget-search" label={t("common.search")}>
        {" "}
        <Input
          id="budget-search"
          onChange={(event) => {
            onFiltersChange({ search: event.target.value });
          }}
          placeholder={t("budgets.searchPlaceholder")}
          value={filters.search}
        />
      </Field>
    </>
  );
}

export function BudgetFiltersSecondary({
  filters,
  onFiltersChange,
}: BudgetFiltersContentProps) {
  const { t } = useI18n();

  return (
    <>
      <Field htmlFor="budget-status-filter" label={t("common.status")}>
        <Select
          id="budget-status-filter"
          onChange={(event) => {
            onFiltersChange({
              status: event.target.value as "ALL" | "ACTIVE" | "ARCHIVED",
            });
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
            onFiltersChange({
              type: event.target.value as BudgetType | "ALL",
            });
          }}
          value={filters.type}
        >
          <option value="ALL">{t("common.allTypes")}</option>
          <option value="GLOBAL">{t("budgetTypes.GLOBAL")}</option>
          <option value="ALLOWANCE">{t("budgetTypes.ALLOWANCE")}</option>
        </Select>
      </Field>
    </>
  );
}
