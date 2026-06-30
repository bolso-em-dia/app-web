import { apiRequest } from "./client";

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

export type ArchiveAccountPayload = {
  archivedFromMonth: string;
};

export function listAccounts(accessToken: string) {
  return apiRequest<Account[]>("/api/accounts", {
    method: "GET",
    accessToken,
  });
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

export function archiveAccount(
  id: string,
  payload: ArchiveAccountPayload,
  accessToken: string,
) {
  return apiRequest<Account>(`/api/accounts/${id}/archive`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(payload),
  });
}
