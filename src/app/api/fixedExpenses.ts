import { apiRequest, type PageResponse } from "./client";
import type { SortDirection } from "../../lib/sorting";
import type { TransactionType } from "./transactions";

export type FixedExpenseTemplate = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  convertedAmount?: number | null;
  exchangeRate?: number | null;
  currency?: string | null;
  categoryId: string;
  categoryName: string;
  accountId: string;
  accountName: string;
  dueDay: number;
  createdInMonth: string;
  archivedFromMonth: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FixedExpenseTemplatePayload = {
  name: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  categoryId: string;
  accountId: string;
  dueDay: number;
};

export type FixedExpenseFilters = {
  search?: string;
  status?: "ALL" | "ACTIVE" | "ARCHIVED";
  type?: TransactionType;
  accountId?: string;
  categoryIds?: string[];
};

export type FixedExpenseSortBy = "name" | "amount" | "dueDay";

export type FixedExpenseTemplateListParams = FixedExpenseFilters & {
  page: number;
  size: number;
  sortBy?: FixedExpenseSortBy;
  sortDir?: SortDirection;
};

export function listFixedExpenseTemplates(
  { page, size, search, status = "ACTIVE", type, accountId, categoryIds, sortBy, sortDir }: FixedExpenseTemplateListParams,
  accessToken: string,
) {
  const query = new URLSearchParams({
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

  if (accountId) {
    query.set("accountId", accountId);
  }

  if (categoryIds) {
    for (const categoryId of categoryIds) {
      query.append("categoryIds", categoryId);
    }
  }

  if (sortBy) {
    query.set("sortBy", toApiFixedExpenseSortBy(sortBy));
  }

  if (sortDir) {
    query.set("sortDir", sortDir.toUpperCase());
  }

  return apiRequest<PageResponse<FixedExpenseTemplate>>(`/api/fixed-transactions?${query.toString()}`, {
    method: "GET",
    accessToken,
  });
}

function toApiFixedExpenseSortBy(sortBy: FixedExpenseSortBy) {
  switch (sortBy) {
    case "name":
      return "NAME";
    case "amount":
      return "AMOUNT";
    case "dueDay":
      return "DUE_DAY";
  }
}

export function createFixedExpenseTemplate(payload: FixedExpenseTemplatePayload, accessToken: string) {
  return apiRequest<FixedExpenseTemplate>("/api/fixed-transactions", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function updateFixedExpenseTemplate(id: string, payload: FixedExpenseTemplatePayload, accessToken: string) {
  return apiRequest<FixedExpenseTemplate>(`/api/fixed-transactions/${id}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function deleteFixedExpenseTemplate(id: string, accessToken: string) {
  return apiRequest<void>(`/api/fixed-transactions/${id}`, {
    method: "DELETE",
    accessToken,
  });
}
