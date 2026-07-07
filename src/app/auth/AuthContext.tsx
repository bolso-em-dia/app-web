import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  login as loginRequest,
  logout as logoutRequest,
  refresh,
  type AuthUser,
} from "../api/auth";
import type { UserPreferences } from "../api/userPreferences";
import { configureApiClientAuth } from "../api/client";
import { AuthContext, type AuthContextValue } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  const setAccessToken = useCallback((value: string | null) => {
    accessTokenRef.current = value;
    setAccessTokenState(value);
  }, []);

  const bootstrapSession = useCallback(async () => {
    try {
      const auth = await refresh();
      setAccessToken(auth.accessToken);
      setUser(auth.user);
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [setAccessToken]);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const auth = await loginRequest(email, password);
      setAccessToken(auth.accessToken);
      setUser(auth.user);
    },
    [setAccessToken],
  );

  const handleLogout = useCallback(async () => {
    await logoutRequest();
    setAccessToken(null);
    setUser(null);
  }, [setAccessToken]);

  const updateUserPreferences = useCallback((preferences: UserPreferences) => {
    setUser((current) =>
      current
        ? {
            ...current,
            preferences,
          }
        : current,
    );
  }, []);

  useEffect(() => {
    configureApiClientAuth({
      getAccessToken: () => accessTokenRef.current,
      refreshAccessToken: async () => {
        try {
          const auth = await refresh();
          setAccessToken(auth.accessToken);
          setUser(auth.user);
          return auth.accessToken;
        } catch {
          setAccessToken(null);
          setUser(null);
          return null;
        }
      },
      onUnauthorized: () => {
        setAccessToken(null);
        setUser(null);
      },
    });

    void bootstrapSession();

    return () => {
      configureApiClientAuth({});
    };
  }, [bootstrapSession, setAccessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      isLoading,
      login: handleLogin,
      logout: handleLogout,
      updateUserPreferences,
    }),
    [
      accessToken,
      handleLogin,
      handleLogout,
      isLoading,
      updateUserPreferences,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
