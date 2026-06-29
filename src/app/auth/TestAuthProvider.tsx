import type { ReactNode } from "react";
import type { AuthUser } from "../api/auth";
import { AuthContext, type AuthContextValue } from "./authContext";

export function TestAuthProvider({
  children,
  user,
}: {
  children: ReactNode;
  user?: AuthUser | null;
}) {
  const value: AuthContextValue = {
    accessToken: user ? "test-token" : null,
    user: user ?? null,
    isAuthenticated: Boolean(user),
    isLoading: false,
    login: async () => undefined,
    logout: async () => undefined,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
