import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { OwnershipType, TransactionFilters, TransactionType } from "../../app/api/transactions";
import { useI18n } from "../../app/i18n/I18nContext";
import FilterToolbar from "../../components/ui/FilterToolbar";
import FilterCategoryMultiInput from "../../components/ui/filterFields/FilterCategoryMultiInput";
import FilterMonthInput from "../../components/ui/filterFields/FilterMonthInput";
import FilterSelectInput from "../../components/ui/filterFields/FilterSelectInput";
import FilterTextInput from "../../components/ui/filterFields/FilterTextInput";
import type { FilterFields } from "../../lib/filterFields";
import { useAccountOptions } from "../../lib/options/useAccountOptions";
import { useCategoryOptions } from "../../lib/options/useCategoryOptions";
import { useFamilyMemberOptions } from "../../lib/options/useFamilyMemberOptions";
import { useFilterController } from "../../lib/useFilterController";

type TransactionFiltersPanelProps = {
  value: TransactionFilters;
  onChange: Dispatch<SetStateAction<TransactionFilters>>;
};

export default function TransactionFiltersPanel({ value, onChange }: TransactionFiltersPanelProps) {
  const { t } = useI18n();
  const controller = useFilterController(value, onChange);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { filters, patch } = controller;
  const { options: accountOptions } = useAccountOptions();
  const { options: categoryOptions } = useCategoryOptions(filters.referenceMonth);
  const { options: memberOptions } = useFamilyMemberOptions({
    allowanceEnabledOnly: true,
  });

  const fields = useMemo<FilterFields>(
    () => ({
      referenceMonth: {
        kind: "text",
        label: t("common.referenceMonth"),
        value: filters.referenceMonth,
        defaultValue: filters.referenceMonth,
        placement: "visible",
        element: (
          <FilterMonthInput
            id="transaction-filter-month"
            label={t("common.referenceMonth")}
            onChange={(newMonth) => {
              patch({ referenceMonth: newMonth });
            }}
            value={filters.referenceMonth}
          />
        ),
      },
      search: {
        kind: "text",
        label: t("common.search"),
        value: filters.search ?? "",
        defaultValue: "",
        placement: "visible",
        element: (
          <FilterTextInput
            id="transaction-search"
            label={t("common.search")}
            onChange={(search) => {
              patch({ search: search || undefined });
            }}
            placeholder={t("transactions.searchPlaceholder")}
            value={filters.search ?? ""}
          />
        ),
      },
      type: {
        kind: "select",
        label: t("common.type"),
        value: filters.type ?? "",
        defaultValue: "",
        placement: "visible",
        options: [
          { value: "INCOME", label: t("transactionTypes.INCOME") },
          { value: "EXPENSE", label: t("transactionTypes.EXPENSE") },
        ],
        element: (
          <FilterSelectInput<TransactionType>
            id="transaction-filter-type"
            label={t("common.type")}
            onChange={(nextValue) => {
              patch({ type: nextValue || undefined });
            }}
            options={[
              { value: "INCOME", label: t("transactionTypes.INCOME") },
              { value: "EXPENSE", label: t("transactionTypes.EXPENSE") },
            ]}
            placeholder={t("common.allTypes")}
            value={filters.type ?? ""}
          />
        ),
      },
      ownershipType: {
        kind: "select",
        label: t("common.ownership"),
        value: filters.ownershipType ?? "",
        defaultValue: "",
        placement: "expanded",
        options: [
          { value: "SHARED", label: t("ownershipTypes.SHARED") },
          { value: "INDIVIDUAL", label: t("ownershipTypes.INDIVIDUAL") },
        ],
        element: (
          <FilterSelectInput<OwnershipType>
            id="transaction-filter-ownership"
            label={t("common.ownership")}
            onChange={(nextValue) => {
              patch({ ownershipType: nextValue || undefined });
            }}
            options={[
              { value: "SHARED", label: t("ownershipTypes.SHARED") },
              { value: "INDIVIDUAL", label: t("ownershipTypes.INDIVIDUAL") },
            ]}
            placeholder={t("common.allOwnerships")}
            value={filters.ownershipType ?? ""}
          />
        ),
      },
      accountId: {
        kind: "select",
        label: t("common.account"),
        value: filters.accountId ?? "",
        defaultValue: "",
        placement: "expanded",
        options: accountOptions,
        element: (
          <FilterSelectInput
            id="transaction-filter-account"
            label={t("common.account")}
            onChange={(nextValue) => {
              patch({ accountId: nextValue || undefined });
            }}
            options={accountOptions}
            placeholder={t("common.allAccounts")}
            value={filters.accountId ?? ""}
          />
        ),
      },
      categoryIds: {
        kind: "multi-select",
        label: t("common.categories"),
        value: filters.categoryIds ?? [],
        defaultValue: [],
        placement: "expanded",
        options: categoryOptions,
        element: (
          <FilterCategoryMultiInput
            id="transaction-filter-category"
            label={t("common.categories")}
            onChange={(nextValue) => {
              patch({
                categoryIds: nextValue.length > 0 ? nextValue : undefined,
              });
            }}
            options={categoryOptions}
            placeholder={t("common.allCategories")}
            value={filters.categoryIds ?? []}
          />
        ),
      },
      memberId: {
        kind: "select",
        label: t("common.member"),
        value: filters.memberId ?? "",
        defaultValue: "",
        placement: "expanded",
        options: memberOptions,
        element: (
          <FilterSelectInput
            id="transaction-filter-member"
            label={t("common.member")}
            onChange={(nextValue) => {
              patch({ memberId: nextValue || undefined });
            }}
            options={memberOptions}
            placeholder={t("common.allMembers")}
            value={filters.memberId ?? ""}
          />
        ),
      },
    }),
    [accountOptions, categoryOptions, filters, memberOptions, patch, t],
  );

  return (
    <FilterToolbar
      fields={fields}
      isPanelOpen={isPanelOpen}
      onClosePanel={() => setIsPanelOpen(false)}
      onResetField={(name, defaultValue) => {
        if (name === "referenceMonth") {
          patch({ referenceMonth: String(defaultValue) });
          return;
        }

        if (Array.isArray(defaultValue)) {
          patch({
            [name]: defaultValue.length > 0 ? defaultValue : undefined,
          } as Partial<TransactionFilters>);
          return;
        }

        patch({
          [name]: defaultValue === "" ? undefined : defaultValue,
        } as Partial<TransactionFilters>);
      }}
      onTogglePanel={() => setIsPanelOpen((current) => !current)}
    />
  );
}
