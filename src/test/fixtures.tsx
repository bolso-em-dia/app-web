/**
 * Shared test data factories.
 *
 * Every function accepts an optional `overrides` parameter that is
 * shallow-merged on top of sensible defaults.  This keeps test files
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
}

export function createAccount(
  overrides: Partial<TestAccount> = {},
): TestAccount {
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
    ...overrides,
  };
}
