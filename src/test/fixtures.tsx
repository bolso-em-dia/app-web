/* eslint-disable react-refresh/only-export-components */
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import type { AuthUser } from "../app/api/auth";
import { TestAuthProvider } from "../app/auth/TestAuthProvider";
import { I18nProvider } from "../app/i18n/I18nContext";

/**
 * Shared test data factories.
 *
 * Every function accepts an optional `overrides` parameter that is
 * shallow-merged on top of sensible defaults. This keeps test files
 * focused on the behaviour under test instead of repeating boilerplate.
 */

export interface TestAccount {
  id: string;
  name: string;
  type: "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "INVESTMENT";
  brand: string | null;
  color: string;
  closingDay: number | null;
  dueDay: number | null;
  createdInMonth: string;
  archivedFromMonth: string | null;
  createdAt: string;
  updatedAt: string;
  currency?: "BRL" | "USD";
}

type TestUser = AuthUser;

export function createUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: "user-1",
    name: "Admin",
    email: "admin@bolso-em-dia.local",
    role: "ADMIN",
    mustChangePassword: false,
    ...overrides,
    preferences: {
      defaultAccountId: null,
      locale: "pt-BR",
      showBalanceWithBudgets: false,
      showForeignCurrency: false,
      ...overrides.preferences,
    },
  };
}

export function createAccount(overrides: Partial<TestAccount> = {}): TestAccount {
  return {
    id: "account-1",
    name: "Main checking",
    type: "CHECKING",
    brand: null,
    color: "#2254d1",
    closingDay: null,
    dueDay: null,
    createdInMonth: "2026-06-01",
    archivedFromMonth: null,
    createdAt: "2026-06-01T10:00:00Z",
    updatedAt: "2026-06-01T10:00:00Z",
    currency: "BRL",
    ...overrides,
  };
}

type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  route?: string;
  user?: (Partial<TestUser> & Record<string, unknown>) | null;
  authOverrides?: Parameters<typeof TestAuthProvider>[0]["authOverrides"];
};

function Providers({
  children,
  route,
  user,
  authOverrides,
}: {
  children: ReactNode;
  route: string;
  user?: (Partial<TestUser> & Record<string, unknown>) | null;
  authOverrides?: Parameters<typeof TestAuthProvider>[0]["authOverrides"];
}) {
  const resolvedUser = user === null ? null : createUser(user);

  return (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[route]}>
      <TestAuthProvider authOverrides={authOverrides} user={resolvedUser}>
        <I18nProvider>{children}</I18nProvider>
      </TestAuthProvider>
    </MemoryRouter>
  );
}

export function renderWithProviders(ui: ReactElement, { route = "/", user, authOverrides, ...options }: RenderWithProvidersOptions = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <Providers authOverrides={authOverrides} route={route} user={user}>
        {children}
      </Providers>
    ),
    ...options,
  });
}
