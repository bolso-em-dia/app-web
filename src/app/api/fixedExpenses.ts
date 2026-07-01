import { apiRequest, type PageResponse } from "./client";

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

export type FixedExpenseTemplateListParams = {
  page: number;
  size: number;
  search?: string;
  status?: "ALL" | "ACTIVE" | "ARCHIVED";
};

export function listFixedExpenseTemplates(
  { page, size, search, status = "ALL" }: FixedExpenseTemplateListParams,
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

  return apiRequest<PageResponse<FixedExpenseTemplate>>(
    `/api/fixed-expense-templates?${query.toString()}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export function listFixedExpenseTemplateById(id: string, accessToken: string) {
  return apiRequest<FixedExpenseTemplate>(
    `/api/fixed-expense-templates/${id}`,
    {
      method: "GET",
      accessToken,
    },
  );
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

export function archiveFixedExpenseTemplate(id: string, accessToken: string) {
  return apiRequest<FixedExpenseTemplate>(
    `/api/fixed-expense-templates/${id}/archive`,
    {
      method: "PATCH",
      accessToken,
      body: JSON.stringify({}),
    },
  );
}
