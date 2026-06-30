import { apiRequest, type PageResponse } from "./client";

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  createdInMonth: string;
  archivedFromMonth: string | null;
  replacementCategoryId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryOption = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

export type CategoryPayload = {
  name: string;
  icon?: string;
  color?: string;
};

export type ArchiveCategoryPayload = {
  archivedFromMonth: string;
  replacementCategoryId: string;
};

export type CategoryListParams = {
  page: number;
  size: number;
  search?: string;
  status?: "ALL" | "ACTIVE" | "ARCHIVED";
};

export function listCategories(
  { page, size, search, status = "ALL" }: CategoryListParams,
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

  return apiRequest<PageResponse<Category>>(
    `/api/categories?${query.toString()}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export function createCategory(payload: CategoryPayload, accessToken: string) {
  return apiRequest<Category>("/api/categories", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function updateCategory(
  id: string,
  payload: CategoryPayload,
  accessToken: string,
) {
  return apiRequest<Category>(`/api/categories/${id}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function archiveCategory(
  id: string,
  payload: ArchiveCategoryPayload,
  accessToken: string,
) {
  return apiRequest<Category>(`/api/categories/${id}/archive`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function listCategoryOptions(
  referenceMonth: string,
  accessToken: string,
) {
  return apiRequest<CategoryOption[]>(
    `/api/categories/options?referenceMonth=${referenceMonth}`,
    {
      method: "GET",
      accessToken,
    },
  );
}
