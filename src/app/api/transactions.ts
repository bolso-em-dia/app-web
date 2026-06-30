import { apiRequest } from "./client";

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
  createdAt: string;
  updatedAt: string;
};

export type TransactionPayload = {
  type: TransactionType;
  ownershipType: OwnershipType;
  description: string;
  amount: number;
  transactionDate: string;
  referenceMonth: string;
  accountId: string;
  categoryId: string;
  memberId?: string;
  installmentCount?: number;
};

export type TransactionFilters = {
  referenceMonth: string;
  type?: TransactionType;
  ownershipType?: OwnershipType;
  accountId?: string;
  categoryId?: string;
  memberId?: string;
};

function buildQuery(filters: TransactionFilters) {
  const searchParams = new URLSearchParams({
    referenceMonth: filters.referenceMonth,
  });

  if (filters.type) {
    searchParams.set("type", filters.type);
  }

  if (filters.ownershipType) {
    searchParams.set("ownershipType", filters.ownershipType);
  }

  if (filters.accountId) {
    searchParams.set("accountId", filters.accountId);
  }

  if (filters.categoryId) {
    searchParams.set("categoryId", filters.categoryId);
  }

  if (filters.memberId) {
    searchParams.set("memberId", filters.memberId);
  }

  return searchParams.toString();
}

export function listTransactions(
  filters: TransactionFilters,
  accessToken: string,
) {
  return apiRequest<Transaction[]>(`/api/transactions?${buildQuery(filters)}`, {
    method: "GET",
    accessToken,
  });
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
