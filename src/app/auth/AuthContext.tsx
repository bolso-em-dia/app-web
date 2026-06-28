import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { login as loginRequest, logout as logoutRequest, me, refresh, type AuthUser } from "../api/auth";

type AuthContextValue = {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
      logout: handleLogout
    }),
    [accessToken, isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function TestAuthProvider({
  children,
  user
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
    logout: async () => undefined
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }
  return context;
}
