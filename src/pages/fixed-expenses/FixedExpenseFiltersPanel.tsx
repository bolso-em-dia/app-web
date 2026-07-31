import { useMemo, useState } from "react";
import type { Dispatch, ReactNode, Ref, SetStateAction } from "react";
import type { FixedExpenseFilters } from "../../app/api/fixedExpenses";
import type { TransactionType } from "../../app/api/transactions";
import { useI18n } from "../../app/i18n/I18nContext";
import FilterToolbar from "../../components/ui/FilterToolbar";
import FilterCategoryMultiInput from "../../components/ui/filterFields/FilterCategoryMultiInput";
import FilterSelectInput from "../../components/ui/filterFields/FilterSelectInput";
import FilterTextInput from "../../components/ui/filterFields/FilterTextInput";
import { ACTIVE_STATUS_FILTER, type StatusFilter } from "../../lib/constants";
import type { FilterFields } from "../../lib/filterFields";
import { useAccountOptions } from "../../lib/options/useAccountOptions";
import { useCategoryOptions } from "../../lib/options/useCategoryOptions";
import { useFilterController } from "../../lib/useFilterController";

type FixedExpenseFiltersPanelProps = {
  actions?: ReactNode;
  referenceMonth: string;
  value: FixedExpenseFilters;
  onChange: Dispatch<SetStateAction<FixedExpenseFilters>>;
  isMobileSearchOpen?: boolean;
  isMobileSearchFocused?: boolean;
  mobileSearchInputRef?: Ref<HTMLInputElement>;
  onDismissMobileSearchFocus?: () => void;
  onMobileSearchBlur?: () => void;
  onMobileSearchFocus?: () => void;
  onCloseMobileSearch?: () => void;
};

export default function FixedExpenseFiltersPanel({
  actions,
  referenceMonth,
  value,
  onChange,
  onCloseMobileSearch,
  isMobileSearchOpen,
  isMobileSearchFocused,
  mobileSearchInputRef,
  onDismissMobileSearchFocus,
  onMobileSearchBlur,
  onMobileSearchFocus,
}: FixedExpenseFiltersPanelProps) {
  const { t } = useI18n();
  const controller = useFilterController(value, onChange);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { filters, patch } = controller;
  const { options: accountOptions } = useAccountOptions();
  const { options: categoryOptions } = useCategoryOptions(referenceMonth);

  const fields = useMemo<FilterFields>(
    () => ({
      search: {
        kind: "text",
        label: t("common.search"),
        value: filters.search ?? "",
        defaultValue: "",
        placement: "visible",
        element: (
          <FilterTextInput
            id="fixed-expense-search"
            inputRef={mobileSearchInputRef}
            label={t("common.search")}
            onBlur={onMobileSearchBlur}
            onChange={(search) => {
              patch({ search: search || undefined });
            }}
            onFocus={onMobileSearchFocus}
            placeholder={t("fixedTransactions.searchPlaceholder")}
            value={filters.search ?? ""}
          />
        ),
      },
      status: {
        kind: "select",
        label: t("common.status"),
        value: filters.status ?? ACTIVE_STATUS_FILTER,
        defaultValue: ACTIVE_STATUS_FILTER,
        placement: "visible",
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
              patch({ status: status as StatusFilter });
            }}
            options={[
              { value: "ALL", label: t("common.all") },
              { value: "ACTIVE", label: t("common.active") },
              { value: "ARCHIVED", label: t("common.archived") },
            ]}
            placeholder={t("common.all")}
            value={filters.status ?? ACTIVE_STATUS_FILTER}
          />
        ),
      },
      type: {
        kind: "select",
        label: t("common.type"),
        value: filters.type ?? "",
        defaultValue: "",
        placement: "expanded",
        options: [
          { value: "INCOME", label: t("transactionTypes.INCOME") },
          { value: "EXPENSE", label: t("transactionTypes.EXPENSE") },
        ],
        element: (
          <FilterSelectInput<TransactionType>
            id="fixed-expense-type-filter"
            label={t("common.type")}
            onChange={(type) => {
              patch({ type: type || undefined });
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
      accountId: {
        kind: "select",
        label: t("common.account"),
        value: filters.accountId ?? "",
        defaultValue: "",
        placement: "expanded",
        options: accountOptions,
        element: (
          <FilterSelectInput
            id="fixed-expense-account-filter"
            label={t("common.account")}
            onChange={(accountId) => {
              patch({ accountId: accountId || undefined });
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
            id="fixed-expense-category-filter"
            label={t("common.categories")}
            onChange={(categoryIds) => {
              patch({ categoryIds: categoryIds.length > 0 ? categoryIds : undefined });
            }}
            options={categoryOptions}
            placeholder={t("common.allCategories")}
            value={filters.categoryIds ?? []}
          />
        ),
      },
    }),
    [
      accountOptions,
      categoryOptions,
      filters.accountId,
      filters.categoryIds,
      filters.search,
      filters.status,
      filters.type,
      mobileSearchInputRef,
      onMobileSearchBlur,
      onMobileSearchFocus,
      patch,
      t,
    ],
  );

  return (
    <FilterToolbar
      actions={actions}
      fields={fields}
      onDismissMobileSearchFocus={onDismissMobileSearchFocus}
      onCloseMobileSearch={onCloseMobileSearch}
      isMobileSearchFocused={isMobileSearchFocused}
      isMobileSearchOpen={isMobileSearchOpen}
      isPanelOpen={isPanelOpen}
      onClosePanel={() => setIsPanelOpen(false)}
      onResetField={(name, defaultValue) => {
        if (Array.isArray(defaultValue)) {
          patch({
            [name]: defaultValue.length > 0 ? defaultValue : undefined,
          } as Partial<FixedExpenseFilters>);
          return;
        }

        patch({
          [name]: defaultValue === "" ? undefined : defaultValue,
        } as Partial<FixedExpenseFilters>);
      }}
      onTogglePanel={() => setIsPanelOpen((current) => !current)}
    />
  );
}
