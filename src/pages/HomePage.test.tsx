import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../app/auth/TestAuthProvider";
import { resetFetchMocks, mockJsonResponse, mockFetchUrl } from "../test/setup";
import HomePage from "./HomePage";

const defaultDashboardResponse = {
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
};

function setupDefaultMocks() {
  mockFetchUrl("/api/transactions/materialize", mockJsonResponse(null));
  mockFetchUrl("/api/dashboard", mockJsonResponse(defaultDashboardResponse));
}

describe("HomePage", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
      writable: true,
    });
    window.dispatchEvent(new Event("resize"));

    resetFetchMocks();
    setupDefaultMocks();
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
    resetFetchMocks();

    let callCount = 0;
    mockFetchUrl("/api/dashboard", () => {
      if (++callCount === 1) {
        return {
          ok: false,
          status: 500,
          json: async () => ({}),
          text: async () => "load failed",
        };
      }
      return mockJsonResponse({
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
      });
    });

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

    expect(await screen.findByText("Não foi possível carregar o dashboard agora.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Orçamentos")).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThanOrEqual(2);
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

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
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

  it("shows budget consumption as used over total without linked category text", async () => {
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

    expect(within(budgetRow!).getByText("R$ 150,00 / R$ 1.000,00")).toBeInTheDocument();
    expect(within(budgetRow!).queryByText(/categorias vinculadas/i)).not.toBeInTheDocument();
  });

  it("paginates twelve recent transactions showing ten on page one with navigation controls", async () => {
    resetFetchMocks();

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

    mockFetchUrl(
      "/api/dashboard",
      mockJsonResponse({
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
    );

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

    const transactionsCard = screen.getByText("Lançamentos recentes").closest("section, div");
    expect(transactionsCard).not.toBeNull();

    const paginationButtons = within(transactionsCard! as HTMLElement).queryAllByRole("button");
    expect(paginationButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("shows expenses in red and income in green", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/dashboard",
      mockJsonResponse({
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
    );

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
    resetFetchMocks();

    mockFetchUrl(
      "/api/dashboard",
      mockJsonResponse({
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
    );

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
    resetFetchMocks();

    mockFetchUrl(
      "/api/dashboard",
      mockJsonResponse({
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
    );

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

  it("shows loading spinner while dashboard data is being fetched", async () => {
    resetFetchMocks();

    let resolveFetch: (value: Response) => void;
    const promise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    mockFetchUrl("/api/dashboard", () => promise);

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
          }}
        >
          <HomePage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Carregando dashboard")).toBeInTheDocument();

    resolveFetch!({
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

    await waitFor(() => {
      expect(screen.queryByText("Carregando dashboard")).not.toBeInTheDocument();
    });
  });

  it("shows projected badge on recent transactions for future months", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/dashboard",
      mockJsonResponse({
        referenceMonth: "2026-07-01",
        summary: {
          totalIncome: 1000,
          totalExpense: 200,
          balance: 800,
          availableBalance: 800,
          reservedBudgetAmount: 0,
        },
        budgets: [],
        recentTransactions: [
          {
            id: "proj-1",
            type: "EXPENSE",
            ownershipType: "SHARED",
            sourceType: "FIXED_EXPENSE",
            description: "Projected Rent",
            amount: 200,
            transactionDate: "2026-07-05",
            referenceMonth: "2026-07-01",
            accountId: "a-1",
            accountName: "Main",
            categoryId: "c-1",
            categoryName: "Housing",
            memberId: null,
            memberName: null,
            installmentGroupId: null,
            installmentNumber: null,
            installmentTotal: null,
            projected: true,
            createdAt: "2026-06-01T10:00:00Z",
            updatedAt: "2026-06-01T10:00:00Z",
          },
        ],
        categoryBreakdown: [],
      }),
    );

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <HomePage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Projected Rent")).toBeInTheDocument();
    expect(screen.getByText("Prevista")).toBeInTheDocument();
  });

  it("shows expense with reserved budget amount when budgets are considered", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/dashboard",
      mockJsonResponse({
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
    );

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <HomePage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Saldo realizado")).toBeInTheDocument();

    const switchEl = screen.getByRole("switch", {
      name: "Considerar orçamentos no saldo",
    });
    fireEvent.click(switchEl);

    await waitFor(() => {
      expect(screen.getByText("Saldo livre")).toBeInTheDocument();
    });

    expect(screen.getByText("Despesas + Orçamentos")).toBeInTheDocument();
  });

  it("shows raw expense when budgets are not considered", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/dashboard",
      mockJsonResponse({
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
    );

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <HomePage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Despesas")).toBeInTheDocument();
    expect(screen.queryByText("Despesas + Orçamentos")).not.toBeInTheDocument();
  });

  it("shows USD secondary line for foreign currency transactions in recent list", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/dashboard",
      mockJsonResponse({
        referenceMonth: "2026-06-01",
        summary: {
          totalIncome: 5000,
          totalExpense: 510,
          balance: 4490,
          availableBalance: 4490,
          reservedBudgetAmount: 0,
        },
        budgets: [],
        recentTransactions: [
          {
            id: "tx-usd",
            type: "EXPENSE",
            ownershipType: "SHARED",
            sourceType: "MANUAL",
            description: "Amazon purchase",
            amount: 100,
            convertedAmount: 510,
            exchangeRate: 5.1,
            currency: "USD",
            transactionDate: "2026-06-10",
            referenceMonth: "2026-06-01",
            accountId: "a-1",
            accountName: "US Account",
            categoryId: "c-1",
            categoryName: "Shopping",
            memberId: null,
            memberName: null,
            installmentGroupId: null,
            installmentNumber: null,
            installmentTotal: null,
            projected: false,
            createdAt: "2026-06-01T10:00:00Z",
            updatedAt: "2026-06-01T10:00:00Z",
          },
        ],
        categoryBreakdown: [],
      }),
    );

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <HomePage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Amazon purchase")).toBeInTheDocument();
    expect(screen.getByText(/cot\. 5\.10/)).toBeInTheDocument();
  });
});
