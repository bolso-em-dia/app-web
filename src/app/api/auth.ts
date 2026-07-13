import type { UserPreferences } from "./userPreferences";
import { apiRequest } from "./client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  allowanceEnabled: boolean;
  mustChangePassword: boolean;
  preferences: UserPreferences;
};

export type AuthResponse = {
  accessToken: string;
  expiresInSeconds: number;
  user: AuthUser;
};

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function refresh() {
  return apiRequest<AuthResponse>("/api/auth/refresh", {
    method: "POST",
  });
}

export function logout() {
  return apiRequest<void>("/api/auth/logout", {
    method: "POST",
  });
}

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function changePassword(payload: ChangePasswordPayload, accessToken: string) {
  return apiRequest<AuthUser>("/api/auth/change-password", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}
