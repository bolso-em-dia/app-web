import type { ReactNode } from "react";
import type { AuthUser } from "../api/auth";
import type { UserPreferences } from "../api/userPreferences";
import { AuthContext, type AuthContextValue } from "./authContext";

type TestAuthUser = Omit<AuthUser, "preferences" | "mustChangePassword"> & {
  preferences?: UserPreferences;
  mustChangePassword?: boolean;
};

const defaultPreferences: UserPreferences = {
  defaultAccountId: null,
  locale: "pt-BR",
  showBalanceWithBudgets: false,
};

export function TestAuthProvider({
  children,
  user,
}: {
  children: ReactNode;
  user?: TestAuthUser | null;
}) {
  const resolvedUser = user
    ? {
        ...user,
        mustChangePassword: user.mustChangePassword ?? false,
        preferences: user.preferences ?? defaultPreferences,
      }
    : null;

  const value: AuthContextValue = {
    accessToken: resolvedUser ? "test-token" : null,
    user: resolvedUser,
    isAuthenticated: Boolean(resolvedUser),
    isLoading: false,
    login: async () => undefined,
    logout: async () => undefined,
    updateUserPreferences: () => undefined,
    updateUser: () => undefined,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
