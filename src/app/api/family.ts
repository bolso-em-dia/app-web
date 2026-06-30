import { apiRequest } from "./client";

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

export function listFamilyMembers(accessToken: string) {
  return apiRequest<FamilyMember[]>("/api/family-members", {
    method: "GET",
    accessToken,
  });
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
