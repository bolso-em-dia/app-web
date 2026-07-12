import { apiRequest, type PageResponse } from "./client";

export type FamilyRole = "ADMIN" | "USER";

export type FamilyMember = {
  id: string;
  name: string;
  email: string;
  role: FamilyRole;
  active: boolean;
  allowanceEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateFamilyMemberRequest = {
  name: string;
  email: string;
  password: string;
  role: FamilyRole;
  allowanceEnabled: boolean;
};

export type UpdateFamilyMemberRequest = {
  name: string;
  email: string;
  password?: string;
  role: FamilyRole;
  allowanceEnabled: boolean;
};

export type FamilyMemberListParams = {
  page: number;
  size: number;
  search?: string;
  status?: "ALL" | "ACTIVE" | "ARCHIVED";
};

export function listFamilyMemberPage(
  { page, size, search, status = "ACTIVE" }: FamilyMemberListParams,
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

  return apiRequest<PageResponse<FamilyMember>>(
    `/api/family-members?${query.toString()}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export async function listFamilyMembers(accessToken: string) {
  const response = await apiRequest<
    PageResponse<FamilyMember> | FamilyMember[]
  >("/api/family-members?page=0&size=200&status=ACTIVE", {
    method: "GET",
    accessToken,
  });

  return Array.isArray(response) ? response : response.items;
}

export function createFamilyMember(
  payload: CreateFamilyMemberRequest,
  accessToken: string,
) {
  return apiRequest<FamilyMember>("/api/family-members", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function updateFamilyMember(
  id: string,
  payload: UpdateFamilyMemberRequest,
  accessToken: string,
) {
  return apiRequest<FamilyMember>(`/api/family-members/${id}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function archiveFamilyMember(id: string, accessToken: string) {
  return apiRequest<FamilyMember>(`/api/family-members/${id}/archive`, {
    method: "PATCH",
    accessToken,
  });
}

export function restoreFamilyMember(id: string, accessToken: string) {
  return apiRequest<FamilyMember>(`/api/family-members/${id}/restore`, {
    method: "PATCH",
    accessToken,
  });
}
