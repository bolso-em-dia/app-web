import { apiRequest } from "./client";

export type FixedExpenseTemplate = {
  id: string;
  name: string;
  amount: number;
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
  amount: number;
  categoryId: string;
  accountId: string;
  dueDay: number;
};

export type ArchiveFixedExpenseTemplatePayload = {
  archivedFromMonth: string;
};

export function listFixedExpenseTemplates(accessToken: string) {
  return apiRequest<FixedExpenseTemplate[]>("/api/fixed-expense-templates", {
    method: "GET",
    accessToken,
  });
}

export function createFixedExpenseTemplate(
  payload: FixedExpenseTemplatePayload,
  accessToken: string,
) {
  return apiRequest<FixedExpenseTemplate>("/api/fixed-expense-templates", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function updateFixedExpenseTemplate(
  id: string,
  payload: FixedExpenseTemplatePayload,
  accessToken: string,
) {
  return apiRequest<FixedExpenseTemplate>(
    `/api/fixed-expense-templates/${id}`,
    {
      method: "PUT",
      accessToken,
      body: JSON.stringify(payload),
    },
  );
}

export function archiveFixedExpenseTemplate(
  id: string,
  payload: ArchiveFixedExpenseTemplatePayload,
  accessToken: string,
) {
  return apiRequest<FixedExpenseTemplate>(
    `/api/fixed-expense-templates/${id}/archive`,
    {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    },
  );
}
