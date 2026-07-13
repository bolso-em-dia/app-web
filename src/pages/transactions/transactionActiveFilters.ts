import type { Account } from "../../app/api/accounts";
import type { CategoryOption } from "../../app/api/categories";
import type { FamilyMember } from "../../app/api/family";
import type {
  OwnershipType,
  TransactionFilters,
  TransactionType,
} from "../../app/api/transactions";
import type { Translate } from "../../app/i18n/I18nContext";
import {
  buildSearchActiveFilter,
  buildTypeActiveFilter,
  type ActiveFilter,
} from "../../lib/activeFilters";

function formatCategoryFilterLabel(
  selectedCategories: CategoryOption[],
  t: Translate,
) {
  if (selectedCategories.length === 0) {
    return "";
  }

  const labelPrefix = `${t("common.categories")}: `;

  if (selectedCategories.length === 1) {
    return `${labelPrefix}${selectedCategories[0].name}`;
  }

  if (selectedCategories.length === 2) {
    return `${labelPrefix}${selectedCategories[0].name}, ${selectedCategories[1].name}`;
  }

  return `${labelPrefix}${selectedCategories[0].name} +${selectedCategories.length - 1}`;
}

type BuildTransactionActiveFiltersParams = {
  accounts: Account[];
  allowanceMembers: FamilyMember[];
  categoryOptions: CategoryOption[];
  filters: TransactionFilters;
  t: Translate;
  removeFilter: (key: string) => void;
};

export function buildTransactionActiveFilters({
  accounts,
  allowanceMembers,
  categoryOptions,
  filters,
  t,
  removeFilter,
}: BuildTransactionActiveFiltersParams): ActiveFilter[] {
  const accountName = accounts.find(
    (account) => account.id === filters.accountId,
  )?.name;
  const selectedCategories = categoryOptions.filter((category) =>
    filters.categoryIds?.includes(category.id),
  );
  const memberName = allowanceMembers.find(
    (member) => member.id === filters.memberId,
  )?.name;

  return [
    ...buildSearchActiveFilter(filters.search ?? "", t("common.search"), () =>
      removeFilter("search"),
    ),
    ...buildTransactionTypeActiveFilter(filters.type, t, () =>
      removeFilter("type"),
    ),
    ...buildOwnershipActiveFilter(filters.ownershipType, t, () =>
      removeFilter("ownershipType"),
    ),
    ...buildTypeActiveFilter(
      "account",
      filters.accountId && accountName ? filters.accountId : undefined,
      `${t("common.account")}: ${accountName}`,
      () => removeFilter("accountId"),
    ),
    ...buildTypeActiveFilter(
      "category",
      selectedCategories.length > 0 ? "category" : undefined,
      formatCategoryFilterLabel(selectedCategories, t),
      () => removeFilter("categoryIds"),
    ),
    ...buildTypeActiveFilter(
      "member",
      filters.memberId && memberName ? filters.memberId : undefined,
      `${t("common.member")}: ${memberName}`,
      () => removeFilter("memberId"),
    ),
  ];
}

function buildTransactionTypeActiveFilter(
  type: TransactionType | undefined,
  t: Translate,
  onRemove: () => void,
) {
  if (!type) {
    return [];
  }

  return buildTypeActiveFilter(
    "type",
    type,
    `${t("common.type")}: ${t(`transactionTypes.${type}` as const)}`,
    onRemove,
  );
}

function buildOwnershipActiveFilter(
  ownershipType: OwnershipType | undefined,
  t: Translate,
  onRemove: () => void,
) {
  if (!ownershipType) {
    return [];
  }

  return buildTypeActiveFilter(
    "ownership",
    ownershipType,
    `${t("common.ownership")}: ${t(`ownershipTypes.${ownershipType}` as const)}`,
    onRemove,
  );
}
