import { apiRequest, type PageResponse } from "./client";

export type AccountType = "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "INVESTMENT";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  brand: string | null;
  color: string | null;
  closingDay: number | null;
  dueDay: number | null;
  createdInMonth: string;
  archivedFromMonth: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountPayload = {
  name: string;
  type: AccountType;
  brand?: string;
  color?: string;
  closingDay?: number;
  dueDay?: number;
};

export type AccountListParams = {
  page: number;
  size: number;
  search?: string;
  status?: "ALL" | "ACTIVE" | "ARCHIVED";
  type?: AccountType;
};

export function listAccountPage(
  { page, size, search, status = "ACTIVE", type }: AccountListParams,
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

  return apiRequest<PageResponse<Account>>(
    `/api/accounts?${query.toString()}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export async function listAccounts(accessToken: string) {
  const response = await apiRequest<PageResponse<Account> | Account[]>(
    "/api/accounts?page=0&size=200&status=ACTIVE",
    {
      method: "GET",
      accessToken,
    },
  );

  return Array.isArray(response) ? response : response.items;
}

export type AccountOption = {
  id: string;
  name: string;
  type: AccountType;
};

export function listAccountOptions(
  referenceMonth: string,
  accessToken: string,
) {
  return apiRequest<AccountOption[]>(
    `/api/accounts/options?referenceMonth=${referenceMonth}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export function getAccountById(id: string, accessToken: string) {
  return apiRequest<Account>(`/api/accounts/${id}`, {
    method: "GET",
    accessToken,
  });
}

export function createAccount(payload: AccountPayload, accessToken: string) {
  return apiRequest<Account>("/api/accounts", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function updateAccount(
  id: string,
  payload: AccountPayload,
  accessToken: string,
) {
  return apiRequest<Account>(`/api/accounts/${id}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function archiveAccount(id: string, accessToken: string) {
  return apiRequest<Account>(`/api/accounts/${id}/archive`, {
    method: "PATCH",
    accessToken,
      });
}
