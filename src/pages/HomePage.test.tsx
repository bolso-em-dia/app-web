import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import HomePage from "./HomePage";
import { TestAuthProvider } from "../app/auth/TestAuthProvider";

describe("HomePage", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
      writable: true,
    });
    window.dispatchEvent(new Event("resize"));

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        referenceMonth: "2026-06-01",
        summary: {
          totalIncome: 5000,
          totalExpense: 195,
          balance: 4805,
          availableBalance: 3955,
          reservedBudgetAmount: 850,
        },
        budgets: [
          {
            id: "budget-1",
            name: "Mercado",
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

  it("uses the realized balance as the initial mode when the preference is disabled", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
            preferences: {
              defaultAccountId: null,
              locale: "pt-BR",
              showBalanceWithBudgets: false,
            },
          }}
        >
          <HomePage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Mercado")).toBeInTheDocument();
    expect(screen.getByText("Saldo realizado")).toBeInTheDocument();
    expect(screen.getByText("R$ 4.805,00")).toBeInTheDocument();
  });

  it("shows an error state and retries the dashboard request", async () => {
    vi.mocked(fetch).mockReset();
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error("load failed"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          referenceMonth: "2026-06-01",
          summary: {
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            availableBalance: 0,
            reservedBudgetAmount: 0,
          },
          budgets: [],
          recentTransactions: [],
          categoryBreakdown: [],
        }),
        text: async () => "",
      } as Response);

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
            preferences: {
              defaultAccountId: null,
              locale: "pt-BR",
              showBalanceWithBudgets: true,
            },
          }}
        >
          <HomePage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Não foi possível carregar o dashboard agora."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Sessão")).toBeInTheDocument();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Não foi possível carregar o dashboard agora.")).not.toBeInTheDocument();
  });

  it("renders the dashboard data and toggles the balance mode", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
            preferences: {
              defaultAccountId: null,
              locale: "pt-BR",
              showBalanceWithBudgets: true,
            },
          }}
        >
          <HomePage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Família")).toBeInTheDocument();
    expect(await screen.findByText("Mercado")).toBeInTheDocument();
    expect(await screen.findByText("Market")).toBeInTheDocument();
    expect(screen.getByText("Saldo livre")).toBeInTheDocument();
    expect(screen.getByText("R$ 3.955,00")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("switch", {
        name: "Considerar orçamentos no saldo",
      }),
    );

    expect(screen.getByText("Saldo realizado")).toBeInTheDocument();
    expect(screen.getByText("R$ 4.805,00")).toBeInTheDocument();
  });
});
