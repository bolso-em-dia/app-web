import { apiRequest, type PageResponse } from "./client";

export type TransactionType = "INCOME" | "EXPENSE";
export type OwnershipType = "SHARED" | "INDIVIDUAL";
export type DeleteScope = "SINGLE" | "FUTURE" | "ALL";

export type Transaction = {
  id: string;
  type: TransactionType;
  ownershipType: OwnershipType;
  sourceType: string;
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
  convertedAmount: number;
  exchangeRate?: number | null;
  currency: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type TransactionPayload = {
  type: TransactionType;
  ownershipType: OwnershipType;
  description: string;
  amount: number;
  transactionDate: string;
  accountId: string;
  categoryId: string;
  memberId?: string;
  installmentCount?: number;
};

export type TransactionFilters = {
  referenceMonth: string;
  search?: string;
  type?: TransactionType;
  ownershipType?: OwnershipType;
  accountId?: string;
  categoryIds?: string[];
  memberId?: string;
};

export type TransactionListParams = TransactionFilters & {
  page: number;
  size: number;
};

function buildQuery(filters: TransactionListParams) {
  const searchParams = new URLSearchParams({
    referenceMonth: filters.referenceMonth,
    page: String(filters.page),
    size: String(filters.size),
  });

  if (filters.search) {
    searchParams.set("search", filters.search);
  }

  if (filters.type) {
    searchParams.set("type", filters.type);
  }

  if (filters.ownershipType) {
    searchParams.set("ownershipType", filters.ownershipType);
  }

  if (filters.accountId) {
    searchParams.set("accountId", filters.accountId);
  }

  if (filters.categoryIds) {
    for (const categoryId of filters.categoryIds) {
      searchParams.append("categoryIds", categoryId);
    }
  }

  if (filters.memberId) {
    searchParams.set("memberId", filters.memberId);
  }

  return searchParams.toString();
}

export function listTransactions(
  filters: TransactionListParams,
  accessToken: string,
) {
  return apiRequest<PageResponse<Transaction>>(
    `/api/transactions?${buildQuery(filters)}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export function listTransactionDescriptionSuggestions(
  query: string,
  accessToken: string,
  limit = 8,
) {
  const searchParams = new URLSearchParams({
    query,
    limit: String(limit),
  });

  return apiRequest<string[]>(
    `/api/transactions/descriptions?${searchParams.toString()}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export function createTransaction(
  payload: TransactionPayload,
  accessToken: string,
) {
  return apiRequest<Transaction[]>("/api/transactions", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function updateTransaction(
  id: string,
  payload: Omit<TransactionPayload, "installmentCount">,
  accessToken: string,
) {
  return apiRequest<Transaction>(`/api/transactions/${id}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function deleteTransaction(
  id: string,
  scope: DeleteScope,
  accessToken: string,
) {
  return apiRequest<void>(`/api/transactions/${id}?scope=${scope}`, {
    method: "DELETE",
    accessToken,
  });
}
