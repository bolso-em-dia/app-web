import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import { t } from "../../test/i18n";
import { resetFetchMocks, mockJsonResponse, mockErrorResponse, mockFetchUrl } from "../../test/setup";
import { createUser } from "../../test/fixtures";
import FixedExpenseForm from "./FixedExpenseForm";
import FixedExpensesPage from "./FixedExpensesPage";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true,
  });
  window.dispatchEvent(new Event("resize"));
}

const defaultTemplatesResponse = {
  items: [
    {
      id: "template-1",
      name: "Rent",
      type: "EXPENSE",
      amount: 1800,
      convertedAmount: 1800,
      currency: "BRL",
      categoryId: "cat-1",
      categoryName: "Housing",
      accountId: "account-1",
      accountName: "Main checking",
      dueDay: 5,
      createdInMonth: "2026-06-01",
      archivedFromMonth: null,
      active: true,
      createdAt: "2026-06-01T10:00:00Z",
      updatedAt: "2026-06-01T10:00:00Z",
    },
  ],
  page: 0,
  size: 12,
  totalItems: 1,
  totalPages: 1,
};

const defaultCategoriesResponse = [
  {
    id: "cat-1",
    name: "Housing",
    icon: "home",
    color: "#2254d1",
  },
];

const defaultAccountsResponse = [
  {
    id: "account-1",
    name: "Main checking",
    type: "CHECKING",
  },
];

function setupDefaultMocks() {
  mockFetchUrl("/api/fixed-transactions?", mockJsonResponse(defaultTemplatesResponse));
  mockFetchUrl("/api/categories/options", mockJsonResponse(defaultCategoriesResponse));
  mockFetchUrl("/api/accounts/options", mockJsonResponse(defaultAccountsResponse));
  mockFetchUrl(
    "/api/accounts?",
    mockJsonResponse({ items: defaultAccountsResponse, page: 0, size: 200, totalItems: defaultAccountsResponse.length, totalPages: 1 }),
  );
}

describe("FixedExpensesPage", () => {
  beforeEach(() => {
    setViewportWidth(1024);
    resetFetchMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the status filter visible on mobile while the search dock stays hidden until requested", async () => {
    setViewportWidth(480);

    render(
      <MemoryRouter initialEntries={["/fixed-transactions"]}>
        <TestAuthProvider user={createUser({ id: "1" })}>
          <FixedExpensesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Rent")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: t("common.search") })).not.toBeInTheDocument();
    expect(screen.getByLabelText(t("common.status"))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("common.search") }));

    expect(screen.getByRole("textbox", { name: t("common.search") })).toBeInTheDocument();
    expect(screen.getAllByLabelText(t("common.status"))[0]).toBeInTheDocument();
  });

  it("loads templates and validates required form fields", async () => {
    render(
      <MemoryRouter initialEntries={["/fixed-transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FixedExpensesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Rent")).toBeInTheDocument();
    const rentCard = screen.getByRole("button", { name: /Rent/ });
    expect(within(rentCard).getByText(`Main checking · ${t("fixedTransactions.dueOnDay", { day: "05" })}`)).toBeInTheDocument();
    expect(within(rentCard).getByText("Housing")).toBeInTheDocument();
    expect(within(rentCard).getAllByText("Housing")).toHaveLength(1);
    expect(within(rentCard).getByText(t("transactionTypes.EXPENSE"))).toBeInTheDocument();
    expect(within(rentCard).getByText(t("common.active"))).toBeInTheDocument();
    expect(screen.getByText(t("common.loadedItems", { loaded: 1, total: 1 }))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("fixedTransactions.new") }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(t("common.name")), {
      target: { value: "Water bill" },
    });
    fireEvent.change(screen.getByLabelText(t("common.type")), {
      target: { value: "INCOME" },
    });
    fireEvent.change(screen.getByLabelText(t("fixedTransactions.amount")), {
      target: { value: "150" },
    });
    expect(screen.getByLabelText(t("fixedTransactions.receiptDay"))).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(t("fixedTransactions.receiptDay")), {
      target: { value: "12" },
    });

    fireEvent.click(screen.getByRole("button", { name: t("fixedTransactions.create") }));

    await waitFor(() => {
      expect(screen.getByText(t("validation.requiredCategory"))).toBeInTheDocument();
      expect(screen.getByText(t("validation.requiredAccount"))).toBeInTheDocument();
    });
  });

  it("shows the centered list error state without rendering the empty message", async () => {
    mockFetchUrl("/api/fixed-transactions?", mockErrorResponse(500));
    mockFetchUrl("/api/categories/options", mockJsonResponse(defaultCategoriesResponse));
    mockFetchUrl("/api/accounts/options", mockJsonResponse(defaultAccountsResponse));
    mockFetchUrl(
      "/api/accounts?",
      mockJsonResponse({ items: defaultAccountsResponse, page: 0, size: 200, totalItems: defaultAccountsResponse.length, totalPages: 1 }),
    );

    render(
      <MemoryRouter initialEntries={["/fixed-transactions"]}>
        <TestAuthProvider user={createUser({ id: "1" })}>
          <FixedExpensesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(t("fixedTransactions.error"))).toBeInTheDocument();
    expect(screen.queryByText(t("fixedTransactions.empty"))).not.toBeInTheDocument();
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
  });

  it("sends the expanded fixed-transaction filters and explicit sort params", async () => {
    render(
      <MemoryRouter initialEntries={["/fixed-transactions"]}>
        <TestAuthProvider user={createUser({ id: "1" })}>
          <FixedExpensesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Rent")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: t("common.search") }), { target: { value: "Ren" } });
    fireEvent.click(screen.getByRole("button", { name: t("common.filters") }));

    fireEvent.change(screen.getByLabelText(t("common.type")), { target: { value: "EXPENSE" } });
    fireEvent.change(screen.getByLabelText(t("common.account")), {
      target: { value: "account-1" },
    });
    fireEvent.click(screen.getByLabelText(t("common.categories"), { selector: "button" }));
    fireEvent.click(screen.getByRole("option", { name: /Housing/i }));

    fireEvent.click(screen.getByRole("button", { name: t("common.sortWithValue", { value: t("fixedTransactions.sort.nameAsc") }) }));
    const sortDialog = screen.getByRole("dialog", { name: t("common.sort") });
    fireEvent.click(within(sortDialog).getByRole("radio", { name: t("fixedTransactions.sort.amountDesc") }));

    await waitFor(() => {
      const requests = vi
        .mocked(fetch)
        .mock.calls.map(([input]) => String(input))
        .filter((url) => url.includes("/api/fixed-transactions?"));

      expect(requests.some((url) => url.includes("search=Ren"))).toBe(true);
      expect(requests.some((url) => url.includes("type=EXPENSE"))).toBe(true);
      expect(requests.some((url) => url.includes("accountId=account-1"))).toBe(true);
      expect(requests.some((url) => url.includes("categoryIds=cat-1"))).toBe(true);
      expect(requests.some((url) => url.includes("sortBy=AMOUNT") && url.includes("sortDir=DESC"))).toBe(true);
    });
  });

  it("shows mapped error feedback when fixed transaction save fails", async () => {
    resetFetchMocks();
    setupDefaultMocks();

    mockFetchUrl("/api/fixed-transactions", (input, init) =>
      init?.method === "POST"
        ? mockErrorResponse(
            404,
            JSON.stringify({
              status: 404,
              code: 40401,
              error: "Not Found",
              message: "Account not found.",
            }),
          )
        : mockErrorResponse(404),
    );

    render(
      <MemoryRouter initialEntries={["/fixed-transactions"]}>
        <TestAuthProvider user={createUser({ id: "1" })}>
          <FixedExpensesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Rent")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: t("fixedTransactions.new") }));
    const drawer = screen.getByRole("dialog");

    fireEvent.change(within(drawer).getByLabelText(t("common.name")), {
      target: { value: "Water bill" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("fixedTransactions.amount")), {
      target: { value: "150" },
    });
    fireEvent.change(
      within(drawer).getByLabelText(t("common.account"), {
        selector: "#fixed-expense-account",
      }),
      {
        target: { value: "account-1" },
      },
    );
    fireEvent.click(within(drawer).getByLabelText(t("common.category"), { selector: "button" }));
    fireEvent.click(within(drawer).getByRole("option", { name: /Housing/i }));
    fireEvent.click(within(drawer).getByRole("button", { name: t("fixedTransactions.create") }));

    expect(await screen.findByText(t("error.accountNotFound"))).toBeInTheDocument();
    expect(within(drawer).getByLabelText(t("common.name"))).toHaveValue("Water bill");
  });

  it("renders templates as full-width single-column list", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/fixed-transactions?",
      mockJsonResponse({
        items: [
          {
            id: "t1",
            name: "Rent",
            type: "EXPENSE",
            amount: 1800,
            categoryId: "cat-1",
            categoryName: "Housing",
            accountId: "account-1",
            accountName: "Main checking",
            dueDay: 5,
            createdInMonth: "2026-06-01",
            archivedFromMonth: null,
            active: true,
            createdAt: "2026-06-01T10:00:00Z",
            updatedAt: "2026-06-01T10:00:00Z",
          },
          {
            id: "t2",
            name: "Salary",
            type: "INCOME",
            amount: 5000,
            categoryId: "cat-2",
            categoryName: "Income",
            accountId: "account-1",
            accountName: "Main checking",
            dueDay: 1,
            createdInMonth: "2026-06-01",
            archivedFromMonth: null,
            active: true,
            createdAt: "2026-06-01T10:00:00Z",
            updatedAt: "2026-06-01T10:00:00Z",
          },
        ],
        page: 0,
        size: 12,
        totalItems: 2,
        totalPages: 1,
      }),
    );
    // Use fallback for remaining calls
    mockFetchUrl("/api/categories", mockJsonResponse([]));
    mockFetchUrl("/api/accounts", mockJsonResponse([]));

    render(
      <MemoryRouter initialEntries={["/fixed-transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FixedExpensesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    const salaryCard = screen.getByRole("button", { name: /Salary/ });
    expect(within(salaryCard).getByText("Income")).toBeInTheDocument();
    expect(within(salaryCard).getByText(t("transactionTypes.INCOME"))).toBeInTheDocument();
    expect(screen.getByText(t("common.loadedItems", { loaded: 2, total: 2 }))).toBeInTheDocument();
  });

  it("shows the empty state when no templates exist", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/fixed-transactions?",
      mockJsonResponse({
        items: [],
        page: 0,
        size: 12,
        totalItems: 0,
        totalPages: 0,
      }),
    );
    mockFetchUrl("/api/categories", mockJsonResponse([]));
    mockFetchUrl("/api/accounts", mockJsonResponse([]));

    render(
      <MemoryRouter initialEntries={["/fixed-transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FixedExpensesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(t("fixedTransactions.empty"))).toBeInTheDocument();
    expect(screen.queryByText(t("common.loadedItems", { loaded: 0, total: 0 }))).not.toBeInTheDocument();
  });

  it("opens delete confirmation alertdialog when the delete button is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/fixed-transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FixedExpensesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Rent")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Rent/ }));

    const drawer = screen.getByRole("dialog");
    const accountSelect = within(drawer).getByLabelText(t("common.account"), { selector: "#fixed-expense-account" });
    expect(accountSelect).toHaveValue("account-1");
    expect(within(accountSelect).getByRole("option", { name: "Main checking" }).selected).toBe(true);

    const deleteButton = await screen.findByRole("button", {
      name: t("common.delete"),
    });
    fireEvent.click(deleteButton);

    const alertDialog = screen.getByRole("alertdialog");
    expect(alertDialog).toBeInTheDocument();
    expect(within(alertDialog).getByText(t("confirmations.deleteFixedExpense"))).toBeInTheDocument();
  });

  it("cancels delete confirmation without calling the API", async () => {
    render(
      <MemoryRouter initialEntries={["/fixed-transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FixedExpensesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Rent")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Rent/ }));

    const deleteButton = await screen.findByRole("button", {
      name: t("common.delete"),
    });
    fireEvent.click(deleteButton);

    const alertDialog = screen.getByRole("alertdialog");
    expect(alertDialog).toBeInTheDocument();

    fireEvent.click(within(alertDialog).getByRole("button", { name: t("common.cancel") }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    const deleteCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([input, init]) => String(input).includes("/api/fixed-transactions/") && init?.method === "DELETE");
    expect(deleteCalls.length).toBe(0);
  });

  it("shows error feedback when delete fails", async () => {
    resetFetchMocks();

    setupDefaultMocks();

    // Mock DELETE to fail
    mockFetchUrl("/api/fixed-transactions/", (input, init) => {
      if (init?.method === "DELETE") {
        return mockErrorResponse(500, "Server error");
      }
      return mockErrorResponse(404);
    });

    render(
      <MemoryRouter initialEntries={["/fixed-transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FixedExpensesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Rent")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Rent/ }));

    const deleteButton = await screen.findByRole("button", {
      name: t("common.delete"),
    });
    fireEvent.click(deleteButton);

    const alertDialog = screen.getByRole("alertdialog");
    const confirmButton = within(alertDialog).getByRole("button", {
      name: t("common.delete"),
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(t("error.unexpected"))).toBeInTheDocument();
    });
  });

  it("shows session expired feedback and preserves typed values when submitting without token", async () => {
    render(
      <MemoryRouter initialEntries={["/fixed-transactions"]}>
        <TestAuthProvider authOverrides={{ accessToken: null }} user={createUser({ id: "1" })}>
          <FixedExpenseForm
            accountOptions={defaultAccountsResponse}
            categoryOptions={defaultCategoriesResponse}
            onCancel={vi.fn()}
            onSuccess={vi.fn()}
            template={null}
            user={createUser({ id: "1" })}
          />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const nameInput = screen.getByLabelText(t("common.name"));

    fireEvent.change(nameInput, { target: { value: "Water bill" } });
    fireEvent.change(screen.getByLabelText(t("fixedTransactions.amount")), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${t("common.category")}$`, "i") }));
    fireEvent.click(screen.getByRole("option", { name: /Housing/i }));
    fireEvent.change(screen.getByLabelText(t("common.account"), { selector: "#fixed-expense-account" }), {
      target: { value: "account-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: t("fixedTransactions.create") }));

    expect(await screen.findByText(t("common.sessionExpired"))).toBeInTheDocument();
    expect(nameInput).toHaveValue("Water bill");
  });

  it("loads USD originalAmount when editing a foreign currency fixed expense", async () => {
    resetFetchMocks();

    const usdTemplate = {
      id: "template-usd",
      name: "Netflix",
      type: "EXPENSE" as const,
      amount: 100,
      convertedAmount: 510,
      exchangeRate: 5.1,
      currency: "USD",
      categoryId: "cat-1",
      categoryName: "Streaming",
      accountId: "account-1",
      accountName: "US Account",
      dueDay: 15,
      createdInMonth: "2026-06-01",
      archivedFromMonth: null,
      active: true,
      createdAt: "2026-06-01T10:00:00Z",
      updatedAt: "2026-06-01T10:00:00Z",
    };

    mockFetchUrl(
      "/api/fixed-transactions?",
      mockJsonResponse({
        items: [usdTemplate],
        page: 0,
        size: 12,
        totalItems: 1,
        totalPages: 1,
      }),
    );
    mockFetchUrl("/api/categories/options", mockJsonResponse([{ id: "cat-1", name: "Streaming", icon: "tv", color: "#e91e63" }]));
    mockFetchUrl(
      "/api/accounts/options",
      mockJsonResponse([
        {
          id: "account-1",
          name: "US Account",
          type: "CHECKING",
          currency: "USD",
        },
      ]),
    );
    mockFetchUrl(
      "/api/accounts",
      mockJsonResponse({
        items: [{ id: "account-1", name: "US Account", type: "CHECKING", currency: "USD" }],
        page: 0,
        size: 200,
        totalItems: 1,
        totalPages: 1,
      }),
    );

    render(
      <MemoryRouter initialEntries={["/fixed-transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FixedExpensesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    // Open the edit drawer by clicking the template
    const templateButton = await screen.findByRole("button", { name: /Netflix/i });
    fireEvent.click(templateButton);

    const drawer = screen.getByRole("dialog");
    const accountSelect = within(drawer).getByLabelText(t("common.account"), { selector: "#fixed-expense-account" });
    expect(accountSelect).toHaveValue("account-1");
    expect(within(accountSelect).getByRole("option", { name: "US Account" }).selected).toBe(true);

    // The amount field should show the USD value (100), not the BRL value (510)
    const amountInput = screen.getByLabelText(t("fixedTransactions.amount"));
    expect(amountInput).toHaveValue("$100.00");
  });
});
