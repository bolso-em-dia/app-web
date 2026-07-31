import { apiRequest, type PageResponse } from "./client";
import type { SourceType, TransactionType } from "./transactions";
import type { SortDirection } from "../../lib/sorting";

export type BudgetType = "GLOBAL" | "ALLOWANCE";

type BudgetCategory = {
  id: string;
  name: string;
  color: string | null;
};

type BudgetTransaction = {
  id: string;
  type: TransactionType;
  ownershipType: string;
  sourceType: SourceType;
  description: string;
  amount: number;
  transactionDate: string;
  referenceMonth: string;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  memberId: string | null;
  memberName: string | null;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  fixedExpenseTemplateId?: string | null;
  projected?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type Budget = {
  id: string;
  name: string;
  type: BudgetType;
  ownerMemberId: string | null;
  ownerMemberName: string | null;
  monthlyLimit: number;
  consumedAmount: number;
  remainingAmount: number;
  createdInMonth: string;
  archivedFromMonth: string | null;
  active: boolean;
  categories: BudgetCategory[];
  transactions: BudgetTransaction[];
};

export type BudgetPayload = {
  name: string;
  type: BudgetType;
  ownerMemberId?: string;
  categoryIds?: string[];
  monthlyLimit: number;
};

export type BudgetListParams = {
  referenceMonth: string;
  page: number;
  size: number;
  search?: string;
  status?: "ALL" | "ACTIVE" | "ARCHIVED";
  type?: BudgetType;
  sortBy?: "name" | "monthlyLimit" | "remainingAmount";
  sortDir?: SortDirection;
};

export function listBudgets(
  { referenceMonth, page, size, search, status = "ACTIVE", type, sortBy, sortDir }: BudgetListParams,
  accessToken: string,
) {
  const query = new URLSearchParams({
    referenceMonth,
    page: String(page),
    size: String(size),
    status,
  });

  if (search?.trim()) {
    query.set("search", search.trim());
  }

  if (type) {
    query.set("type", type);
  }

  if (sortBy) {
    query.set("sortBy", toApiBudgetSortBy(sortBy));
  }

  if (sortDir) {
    query.set("sortDir", sortDir.toUpperCase());
  }

  return apiRequest<PageResponse<Budget>>(`/api/budgets?${query.toString()}`, {
    method: "GET",
    accessToken,
  });
}

function toApiBudgetSortBy(sortBy: NonNullable<BudgetListParams["sortBy"]>) {
  switch (sortBy) {
    case "name":
      return "NAME";
    case "monthlyLimit":
      return "MONTHLY_LIMIT";
    case "remainingAmount":
      return "REMAINING_AMOUNT";
  }
}

export function createBudget(payload: BudgetPayload, accessToken: string) {
  return apiRequest<Budget>("/api/budgets", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function updateBudget(id: string, payload: BudgetPayload, accessToken: string) {
  return apiRequest<Budget>(`/api/budgets/${id}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function archiveBudget(id: string, referenceMonth: string, accessToken: string) {
  return apiRequest<Budget>(`/api/budgets/${id}/archive?referenceMonth=${referenceMonth}`, {
    method: "PATCH",
    accessToken,
  });
}
