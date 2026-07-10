/**
 * Shared test data factories.
 *
 * Every function accepts an optional `overrides` parameter that is
 * shallow-merged on top of sensible defaults.  This keeps test files
 * focused on the behaviour under test instead of repeating boilerplate.
 */

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

export function jsonResponse<T>(payload: T): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

export function errorResponse(status: number, message?: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({ message: message ?? "Server error" }),
    text: async () => "",
  } as Response;
}

// ---------------------------------------------------------------------------
// Domain factories
// ---------------------------------------------------------------------------

export interface TestTransaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  ownershipType: "INDIVIDUAL" | "SHARED";
  sourceType: "MANUAL" | "INSTALLMENT" | "FIXED_EXPENSE";
  description: string;
  amount: number;
  transactionDate: string;
  referenceMonth: string;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  memberId: string | null;
  memberName: string | null;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  createdAt: string;
  updatedAt: string;
}

export function createTransaction(
  overrides: Partial<TestTransaction> = {},
): TestTransaction {
  return {
    id: "tx-1",
    type: "EXPENSE",
    ownershipType: "INDIVIDUAL",
    sourceType: "MANUAL",
    description: "Groceries",
    amount: 150,
    transactionDate: "2026-06-10",
    referenceMonth: "2026-06-01",
    accountId: "account-1",
    accountName: "Main checking",
    categoryId: "cat-1",
    categoryName: "Groceries",
    memberId: null,
    memberName: null,
    installmentGroupId: null,
    installmentNumber: null,
    installmentTotal: null,
    createdAt: "2026-06-01T10:00:00Z",
    updatedAt: "2026-06-01T10:00:00Z",
    ...overrides,
  };
}

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

export interface TestCategoryOption {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export function createCategoryOption(
  overrides: Partial<TestCategoryOption> = {},
): TestCategoryOption {
  return {
    id: "cat-1",
    name: "Groceries",
    icon: "shopping-cart",
    color: "#2254d1",
    ...overrides,
  };
}

export interface TestBudget {
  id: string;
  name: string;
  type: "GLOBAL" | "ALLOWANCE";
  ownerMemberId: string | null;
  ownerMemberName: string | null;
  monthlyLimit: number;
  consumedAmount: number;
  remainingAmount: number;
  createdInMonth: string;
  archivedFromMonth: string | null;
  active: boolean;
  categories: { id: string; name: string; color: string }[];
  transactions: {
    id: string;
    description: string;
    amount: number;
    transactionDate: string;
    categoryName: string;
    accountName: string;
  }[];
}

export function createBudget(
  overrides: Partial<TestBudget> = {},
): TestBudget {
  return {
    id: "budget-1",
    name: "Household",
    type: "GLOBAL",
    ownerMemberId: null,
    ownerMemberName: null,
    monthlyLimit: 1200,
    consumedAmount: 320,
    remainingAmount: 880,
    createdInMonth: "2026-06-01",
    archivedFromMonth: null,
    active: true,
    categories: [{ id: "cat-1", name: "Groceries", color: "#2254d1" }],
    transactions: [],
    ...overrides,
  };
}

export interface TestFamilyMember {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  active: boolean;
  allowanceEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function createFamilyMember(
  overrides: Partial<TestFamilyMember> = {},
): TestFamilyMember {
  return {
    id: "member-1",
    name: "Taylor",
    email: "taylor@bolso-em-dia.local",
    role: "USER",
    active: true,
    allowanceEnabled: true,
    createdAt: "2026-06-01T10:00:00Z",
    updatedAt: "2026-06-01T10:00:00Z",
    ...overrides,
  };
}
