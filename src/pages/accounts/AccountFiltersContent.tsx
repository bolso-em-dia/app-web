import type { AccountType } from "../../app/api/accounts";
import { type StatusFilter } from "../../lib/constants";
import { useI18n } from "../../app/i18n/I18nContext";
import Field from "../../components/ui/Field";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";

type AccountFilters = {
  search: string;
  status: StatusFilter;
  type: "" | AccountType;
};

type AccountFiltersContentProps = {
  filters: AccountFilters;
  onFiltersChange: (partial: Partial<AccountFilters>) => void;
};

export function AccountFiltersPrimary({
  filters,
  onFiltersChange,
}: AccountFiltersContentProps) {
  const { t } = useI18n();

  return (
    <Field htmlFor="account-search" label={t("common.search")}>
      <Input
        id="account-search"
        onChange={(event) => {
          onFiltersChange({ search: event.target.value });
        }}
        placeholder={t("accounts.searchPlaceholder")}
        value={filters.search}
      />
    </Field>
  );
}

export function AccountFiltersSecondary({
  filters,
  onFiltersChange,
}: AccountFiltersContentProps) {
  const { t } = useI18n();

  return (
    <>
      <Field htmlFor="account-status-filter" label={t("common.status")}>
        <Select
          id="account-status-filter"
          onChange={(event) => {
            onFiltersChange({
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
      <Field htmlFor="account-type-filter" label={t("common.type")}>
        <Select
          id="account-type-filter"
          onChange={(event) => {
            onFiltersChange({
              type: event.target.value as "" | AccountType,
            });
          }}
          value={filters.type}
        >
          <option value="">{t("common.allTypes")}</option>
          <option value="CHECKING">{t("accountTypes.CHECKING")}</option>
          <option value="SAVINGS">{t("accountTypes.SAVINGS")}</option>
          <option value="CREDIT_CARD">{t("accountTypes.CREDIT_CARD")}</option>
          <option value="INVESTMENT">{t("accountTypes.INVESTMENT")}</option>
        </Select>
      </Field>
    </>
  );
}
