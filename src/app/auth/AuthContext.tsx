import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  login as loginRequest,
  logout as logoutRequest,
  me,
  refresh,
  type AuthUser,
} from "../api/auth";
import { AuthContext, type AuthContextValue } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void bootstrapSession();
  }, []);

  async function bootstrapSession() {
    try {
      const auth = await refresh();
      setAccessToken(auth.accessToken);
      const currentUser = await me(auth.accessToken);
      setUser(currentUser);
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin(email: string, password: string) {
    const auth = await loginRequest(email, password);
    setAccessToken(auth.accessToken);
    setUser(auth.user);
  }

  async function handleLogout() {
    await logoutRequest();
    setAccessToken(null);
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      isLoading,
      login: handleLogin,
      logout: handleLogout,
    }),
    [accessToken, isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
