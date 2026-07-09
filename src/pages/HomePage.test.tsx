import { fireEvent, render, screen, within } from "@testing-library/react";
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
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
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
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
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
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
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

  it("shows budget monthly limit as the main value with consumed as secondary", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
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

    const budgetName = await screen.findByText("Mercado");
    const budgetRow = budgetName.closest("li");
    expect(budgetRow).not.toBeNull();

    expect(
      within(budgetRow!).getByText("R$ 1.000,00"),
    ).toBeInTheDocument();
    expect(
      within(budgetRow!).getByText("Usado R$ 150,00 de R$ 1.000,00"),
    ).toBeInTheDocument();
  });

  it("paginates twelve recent transactions showing ten on page one with navigation controls", async () => {
    vi.mocked(fetch).mockReset();

    const recentTransactions = Array.from({ length: 12 }, (_, index) => ({
      id: `tx-${index + 1}`,
      type: "EXPENSE",
      ownershipType: "SHARED",
      sourceType: "MANUAL",
      description: `Transaction ${index + 1}`,
      amount: 50,
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
    }));

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        referenceMonth: "2026-06-01",
        summary: {
          totalIncome: 5000,
          totalExpense: 600,
          balance: 4400,
          availableBalance: 3550,
          reservedBudgetAmount: 850,
        },
        budgets: [],
        recentTransactions,
        categoryBreakdown: [],
      }),
      text: async () => "",
    } as Response);

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
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

    expect(await screen.findByText("Transaction 1")).toBeInTheDocument();

    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(`Transaction ${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByText("Transaction 11")).not.toBeInTheDocument();
    expect(screen.queryByText("Transaction 12")).not.toBeInTheDocument();

    const transactionsCard = screen
      .getByText("Lançamentos recentes")
      .closest("section, div");
    expect(transactionsCard).not.toBeNull();

    const paginationButtons = within(transactionsCard! as HTMLElement).queryAllByRole("button");
    expect(paginationButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("shows expenses in red and income in green", async () => {
    vi.mocked(fetch).mockReset();
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
        budgets: [],
        recentTransactions: [],
        categoryBreakdown: [],
      }),
      text: async () => "",
    } as Response);

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
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

    const incomeElement = await screen.findByText("R$ 5.000,00");
    expect(incomeElement.className).toContain("income");

    const expenseElement = screen.getByText("-R$ 195,00");
    expect(expenseElement.className).toContain("expense");
  });

  it("budget progress bar shows green below 80%, warning at 80-100%, red above 100%", async () => {
    vi.mocked(fetch).mockReset();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        referenceMonth: "2026-06-01",
        summary: {
          totalIncome: 5000,
          totalExpense: 2400,
          balance: 2600,
          availableBalance: 2600,
          reservedBudgetAmount: 0,
        },
        budgets: [
          {
            id: "budget-a",
            name: "Budget A",
            type: "GLOBAL",
            ownerMemberId: null,
            ownerMemberName: null,
            monthlyLimit: 1000,
            consumedAmount: 300,
            remainingAmount: 700,
            createdInMonth: "2026-06-01",
            archivedFromMonth: null,
            active: true,
            categories: [],
            transactions: [],
          },
          {
            id: "budget-b",
            name: "Budget B",
            type: "GLOBAL",
            ownerMemberId: null,
            ownerMemberName: null,
            monthlyLimit: 1000,
            consumedAmount: 900,
            remainingAmount: 100,
            createdInMonth: "2026-06-01",
            archivedFromMonth: null,
            active: true,
            categories: [],
            transactions: [],
          },
          {
            id: "budget-c",
            name: "Budget C",
            type: "GLOBAL",
            ownerMemberId: null,
            ownerMemberName: null,
            monthlyLimit: 1000,
            consumedAmount: 1200,
            remainingAmount: 0,
            createdInMonth: "2026-06-01",
            archivedFromMonth: null,
            active: true,
            categories: [],
            transactions: [],
          },
        ],
        recentTransactions: [],
        categoryBreakdown: [],
      }),
      text: async () => "",
    } as Response);

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
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

    const budgetAName = await screen.findByText("Budget A");
    const budgetARow = budgetAName.closest("li");
    expect(budgetARow).not.toBeNull();
    const budgetABar = budgetARow!.querySelector("div[aria-hidden] > span");
    expect(budgetABar).not.toBeNull();
    expect(budgetABar).toHaveStyle({ width: "30%" });
    expect(budgetABar!.className).toContain("progressFillSafe");

    const budgetBName = screen.getByText("Budget B");
    const budgetBRow = budgetBName.closest("li");
    expect(budgetBRow).not.toBeNull();
    const budgetBBar = budgetBRow!.querySelector("div[aria-hidden] > span");
    expect(budgetBBar).not.toBeNull();
    expect(budgetBBar).toHaveStyle({ width: "90%" });
    expect(budgetBBar!.className).toContain("progressFillWarning");

    const budgetCName = screen.getByText("Budget C");
    const budgetCRow = budgetCName.closest("li");
    expect(budgetCRow).not.toBeNull();
    const budgetCBar = budgetCRow!.querySelector("div[aria-hidden] > span");
    expect(budgetCBar).not.toBeNull();
    expect(budgetCBar).toHaveStyle({ width: "100%" });
    expect(budgetCBar!.className).toContain("progressFillDanger");
  });

  it("shows the percentage share in the category breakdown", async () => {
    vi.mocked(fetch).mockReset();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        referenceMonth: "2026-06-01",
        summary: {
          totalIncome: 5000,
          totalExpense: 200,
          balance: 4800,
          availableBalance: 3950,
          reservedBudgetAmount: 850,
        },
        budgets: [],
        recentTransactions: [],
        categoryBreakdown: [
          {
            categoryId: "cat-1",
            categoryName: "Groceries",
            amount: 200,
          },
        ],
      }),
      text: async () => "",
    } as Response);

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
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

    expect(await screen.findByText("100.0%")).toBeInTheDocument();
  });
});
