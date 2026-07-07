import { apiRequest } from "./client";

export type UserPreferences = {
  defaultAccountId: string | null;
  locale: "pt-BR" | "en-US";
  showBalanceWithBudgets: boolean;
};

export type UpdateUserPreferencesPayload = {
  defaultAccountId: string | null;
  locale: "pt-BR" | "en-US";
  showBalanceWithBudgets: boolean;
};

export function getCurrentUserPreferences(accessToken: string) {
  return apiRequest<UserPreferences>("/api/me/preferences", {
    method: "GET",
    accessToken,
  });
}

export function updateCurrentUserPreferences(
  payload: UpdateUserPreferencesPayload,
  accessToken: string,
) {
  return apiRequest<UserPreferences>("/api/me/preferences", {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
}
