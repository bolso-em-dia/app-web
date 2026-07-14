import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { TestAuthProvider } from "./app/auth/TestAuthProvider";
import { clearCachedOptionsResources } from "./lib/options/useCachedOptionsResource";
import { mockFetchUrl, mockJsonResponse, resetFetchMocks } from "./test/setup";

const defaultTransactionsResponse = {
  items: [
    {
      id: "tx-1",
      type: "EXPENSE",
      ownershipType: "SHARED",
      sourceType: "MANUAL",
      description: "Groceries",
      amount: 125.5,
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
    },
  ],
  page: 0,
  size: 12,
  totalItems: 1,
  totalPages: 1,
};

function setupTransactionsRouteMocks() {
  mockFetchUrl("/api/transactions/materialize", mockJsonResponse(null));
  mockFetchUrl("/api/transactions?", mockJsonResponse(defaultTransactionsResponse));
  mockFetchUrl("/api/accounts?", mockJsonResponse({ items: [], page: 0, size: 200, totalItems: 0, totalPages: 0 }));
  mockFetchUrl("/api/categories/options", mockJsonResponse([]));
  mockFetchUrl("/api/family-members", mockJsonResponse({ items: [], page: 0, size: 200, totalItems: 0, totalPages: 0 }));
  mockFetchUrl("/api/transactions/descriptions", mockJsonResponse([]));
}

describe("App", () => {
  beforeEach(() => {
    clearCachedOptionsResources();
    resetFetchMocks();
  });

  it("redirects authenticated users from the root route to transactions", async () => {
    setupTransactionsRouteMocks();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <App />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Transações" })).toBeInTheDocument();
  });

  it("redirects flagged users to the mandatory password change page", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
            mustChangePassword: true,
          }}
        >
          <App />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Defina uma nova senha" })).toBeInTheDocument();
  });
});
