import type { ReactNode } from "react";
import type { AuthUser } from "../api/auth";
import type { UserPreferences } from "../api/userPreferences";
import { AuthContext, type AuthContextValue } from "./authContext";

type TestAuthUser = Omit<AuthUser, "preferences" | "mustChangePassword"> & {
  preferences?: UserPreferences;
  mustChangePassword?: boolean;
} & Record<string, unknown>;

const defaultPreferences: UserPreferences = {
  defaultAccountId: null,
  locale: "pt-BR",
  showBalanceWithBudgets: false,
  showForeignCurrency: false,
};

export function TestAuthProvider({
  children,
  user,
  authOverrides,
}: {
  children: ReactNode;
  user?: TestAuthUser | null;
  authOverrides?: Partial<AuthContextValue>;
}) {
  const resolvedUser: AuthUser | null = user
    ? ({
        ...user,
        mustChangePassword: user.mustChangePassword ?? false,
        preferences: user.preferences ?? defaultPreferences,
      } as AuthUser)
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
    ...authOverrides,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
