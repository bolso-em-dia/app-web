import { createContext } from "react";
import type { AuthUser } from "../api/auth";
import type { UserPreferences } from "../api/userPreferences";

export type AuthContextValue = {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPreferences: (preferences: UserPreferences) => void;
  updateUser: (user: AuthUser) => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
