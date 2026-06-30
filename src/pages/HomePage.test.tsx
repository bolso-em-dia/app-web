import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import HomePage from "./HomePage";
import { TestAuthProvider } from "../app/auth/TestAuthProvider";

describe("HomePage", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        referenceMonth: "2026-06-01",
        summary: {
          totalIncome: 5000,
          totalExpense: 195,
          balance: 4805,
        },
        envelopes: [
          {
            id: "env-1",
            name: "Family Essentials",
            type: "GLOBAL",
            ownerMemberId: null,
            ownerMemberName: null,
            monthlyLimit: 1000,
            consumedAmount: 150,
            remainingAmount: 850,
            createdInMonth: "2026-06-01",
            archivedFromMonth: null,
            active: true,
            categories: [],
            transactions: [],
          },
        ],
        recentTransactions: [
          {
            id: "tx-1",
            type: "EXPENSE",
            ownershipType: "SHARED",
            sourceType: "MANUAL",
            description: "Market",
            amount: 150,
            transactionDate: "2026-06-10",
            referenceMonth: "2026-06-01",
            accountId: "acc-1",
            accountName: "Main Checking",
            categoryId: "cat-1",
            categoryName: "Groceries",
            memberId: null,
            memberName: null,
            installmentGroupId: null,
            installmentNumber: null,
            installmentTotal: null,
            createdAt: "2026-06-10T10:00:00Z",
            updatedAt: "2026-06-10T10:00:00Z",
          },
        ],
        categoryBreakdown: [
          {
            categoryId: "cat-1",
            categoryName: "Groceries",
            amount: 150,
          },
        ],
      }),
      text: async () => "",
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dashboard data", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@my-money.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <HomePage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Family")).toBeInTheDocument();
    expect(await screen.findByText("Family Essentials")).toBeInTheDocument();
    expect(await screen.findByText("Market")).toBeInTheDocument();
  });
});
