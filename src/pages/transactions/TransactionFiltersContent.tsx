import type { Account } from "../../app/api/accounts";
import type { CategoryOption } from "../../app/api/categories";
import type { FamilyMember } from "../../app/api/family";
import type {
  OwnershipType,
  TransactionFilters,
  TransactionType,
} from "../../app/api/transactions";
import { useI18n } from "../../app/i18n/I18nContext";
import Field from "../../components/ui/Field";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import CategoryMultiSelect from "../../components/ui/CategoryMultiSelect";
import MonthSelector from "../../components/ui/MonthSelector";

type TransactionFiltersContentProps = {
  filters: TransactionFilters;
  onFiltersChange: (partial: Partial<TransactionFilters>) => void;
  accounts: Account[];
  categoryOptions: CategoryOption[];
  allowanceMembers: FamilyMember[];
};

export function TransactionFiltersPrimary({
  filters,
  onFiltersChange,
}: TransactionFiltersContentProps) {
  const { t } = useI18n();

  return (
    <>
      <Field
        label={t("common.referenceMonth")}
        htmlFor="transaction-filter-month"
      >
        <MonthSelector
          id="transaction-filter-month"
          onChange={(newMonth) => {
            onFiltersChange({ referenceMonth: newMonth });
          }}
          value={filters.referenceMonth}
        />
      </Field>
      <Field htmlFor="transaction-search" label={t("common.search")}>
        <Input
          id="transaction-search"
          onChange={(event) => {
            onFiltersChange({
              search:
                event.target.value.length > 0 ? event.target.value : undefined,
            });
          }}
          placeholder={t("transactions.searchPlaceholder")}
          value={filters.search ?? ""}
        />
      </Field>
      <Field label={t("common.type")} htmlFor="transaction-filter-type">
        <Select
          id="transaction-filter-type"
          onChange={(event) => {
            onFiltersChange({
              type:
                event.target.value.length > 0
                  ? (event.target.value as TransactionType)
                  : undefined,
            });
          }}
          value={filters.type ?? ""}
        >
          <option value="">{t("common.allTypes")}</option>
          <option value="INCOME">{t("transactionTypes.INCOME")}</option>
          <option value="EXPENSE">{t("transactionTypes.EXPENSE")}</option>
        </Select>
      </Field>
    </>
  );
}

export function TransactionFiltersSecondary({
  filters,
  onFiltersChange,
  accounts,
  categoryOptions,
  allowanceMembers,
}: TransactionFiltersContentProps) {
  const { t } = useI18n();

  return (
    <>
      <Field
        label={t("common.ownership")}
        htmlFor="transaction-filter-ownership"
      >
        <Select
          id="transaction-filter-ownership"
          onChange={(event) => {
            onFiltersChange({
              ownershipType:
                event.target.value.length > 0
                  ? (event.target.value as OwnershipType)
                  : undefined,
            });
          }}
          value={filters.ownershipType ?? ""}
        >
          <option value="">{t("common.allOwnerships")}</option>
          <option value="SHARED">{t("ownershipTypes.SHARED")}</option>
          <option value="INDIVIDUAL">{t("ownershipTypes.INDIVIDUAL")}</option>
        </Select>
      </Field>

      <Field label={t("common.account")} htmlFor="transaction-filter-account">
        <Select
          id="transaction-filter-account"
          onChange={(event) => {
            onFiltersChange({
              accountId: event.target.value || undefined,
            });
          }}
          value={filters.accountId ?? ""}
        >
          <option value="">{t("common.allAccounts")}</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label={t("common.categories")}
        htmlFor="transaction-filter-category"
      >
        <CategoryMultiSelect
          id="transaction-filter-category"
          onChange={(value) => {
            onFiltersChange({
              categoryIds: value.length > 0 ? value : undefined,
            });
          }}
          options={categoryOptions}
          placeholder={t("common.allCategories")}
          value={filters.categoryIds ?? []}
        />
      </Field>

      <Field label={t("common.member")} htmlFor="transaction-filter-member">
        <Select
          id="transaction-filter-member"
          onChange={(event) => {
            onFiltersChange({
              memberId: event.target.value || undefined,
            });
          }}
          value={filters.memberId ?? ""}
        >
          <option value="">{t("common.allMembers")}</option>
          {allowanceMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}
