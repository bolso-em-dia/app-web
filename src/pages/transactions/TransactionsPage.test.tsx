import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import { getCurrentReferenceMonth, shiftReferenceMonth } from "../../lib/formatters/date";
import { resetFetchMocks, mockJsonResponse, mockErrorResponse, mockFetchUrl } from "../../test/setup";
import { t } from "../../test/i18n";
import { clearCachedOptionsResources } from "../../lib/options/useCachedOptionsResource";
import TransactionsPage from "./TransactionsPage";

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

const defaultAccountsResponse = {
  items: [
    {
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
    },
  ],
  page: 0,
  size: 200,
  totalItems: 1,
  totalPages: 1,
};

const defaultCategoriesResponse = [
  {
    id: "cat-1",
    name: "Groceries",
    icon: "shopping-cart",
    color: "#2254d1",
  },
  {
    id: "cat-2",
    name: "Transport",
    icon: "car",
    color: "#14a44d",
  },
];

const defaultMembersResponse = {
  items: [
    {
      id: "member-1",
      name: "Taylor",
      email: "taylor@bolso-em-dia.local",
      role: "USER",
      active: true,
      allowanceEnabled: true,
      createdAt: "2026-06-01T10:00:00Z",
      updatedAt: "2026-06-01T10:00:00Z",
    },
  ],
  page: 0,
  size: 200,
  totalItems: 1,
  totalPages: 1,
};

function setupDefaultMocks() {
  mockFetchUrl("/api/transactions/materialize", mockJsonResponse(null));
  mockFetchUrl("/api/transactions?", mockJsonResponse(defaultTransactionsResponse));
  mockFetchUrl("/api/accounts?", mockJsonResponse(defaultAccountsResponse));
  mockFetchUrl("/api/categories/options", mockJsonResponse(defaultCategoriesResponse));
  mockFetchUrl("/api/family-members", mockJsonResponse(defaultMembersResponse));
  mockFetchUrl("/api/transactions/descriptions", mockJsonResponse([]));
}

function selectCategory(container: HTMLElement, categoryName: string) {
  fireEvent.click(within(container).getByLabelText(t("common.category"), { selector: "button" }));
  fireEvent.click(
    within(container).getByRole("option", {
      name: new RegExp(categoryName, "i"),
    }),
  );
}

describe("TransactionsPage", () => {
  beforeEach(() => {
    clearCachedOptionsResources();
    resetFetchMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads transactions and validates member selection for individual ownership", async () => {
    setupDefaultMocks();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: /Groceries/i })).toBeInTheDocument();
    expect(screen.getByText(t("common.loadedItems", { loaded: 1, total: 1 }))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("transactions.new") }));
    const drawer = screen.getByRole("dialog");

    fireEvent.change(within(drawer).getByLabelText(t("transactions.description")), {
      target: { value: "A" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("transactions.amount")), {
      target: { value: "45" },
    });
    fireEvent.change(
      within(drawer).getByLabelText(t("common.account"), {
        selector: "#transaction-account",
      }),
      {
        target: { value: "account-1" },
      },
    );
    selectCategory(drawer, "Groceries");
    fireEvent.click(within(drawer).getByRole("switch", { name: `${t("common.ownership")} ${t("ownershipTypes.INDIVIDUAL")}` }));

    fireEvent.click(within(drawer).getByRole("button", { name: t("transactions.saveAndCreateNew") }));

    await waitFor(() => {
      expect(screen.getByText(t("validation.requiredIndividualMember"))).toBeInTheDocument();
    });
  });

  it("renders the category as a badge below the title and keeps account/date in the meta line", async () => {
    setupDefaultMocks();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const transactionButton = await screen.findByRole("button", { name: /Groceries/i });

    expect(within(transactionButton).getAllByText("Groceries")).toHaveLength(2);
    expect(within(transactionButton).getByText(/Main checking/)).toBeInTheDocument();
    expect(within(transactionButton).queryByText(/Groceries · Main checking/)).not.toBeInTheDocument();
  });

  it("shows description suggestions and preserves non-varying fields on save and create new", async () => {
    resetFetchMocks();

    setupDefaultMocks();
    mockFetchUrl("/api/transactions/descriptions", mockJsonResponse(["Groceries", "Groceries monthly"]));

    // Mock POST response
    let postCallCount = 0;
    mockFetchUrl("/api/transactions", (input, init) => {
      if (init?.method === "POST") {
        postCallCount++;
        if (postCallCount === 1) {
          return mockJsonResponse([
            {
              id: "tx-2",
              type: "INCOME",
              ownershipType: "SHARED",
              sourceType: "MANUAL",
              description: "Groceries monthly",
              amount: 0.9,
              transactionDate: "2026-07-01",
              referenceMonth: "2026-07-01",
              accountId: "account-1",
              accountName: "Main checking",
              categoryId: "cat-1",
              categoryName: "Groceries",
              memberId: null,
              memberName: null,
              installmentGroupId: null,
              installmentNumber: null,
              installmentTotal: null,
              createdAt: "2026-07-01T10:00:00Z",
              updatedAt: "2026-07-01T10:00:00Z",
            },
          ]);
        }
      }
      return mockErrorResponse(404);
    });

    // Mock reload after create
    mockFetchUrl("/api/transactions?", (input) => {
      const url = String(input);
      if (url.includes("referenceMonth=2026-07")) {
        return mockJsonResponse({
          items: [
            {
              id: "tx-2",
              type: "INCOME",
              ownershipType: "SHARED",
              sourceType: "MANUAL",
              description: "Groceries monthly",
              amount: 0.9,
              transactionDate: "2026-07-01",
              referenceMonth: "2026-07-01",
              accountId: "account-1",
              accountName: "Main checking",
              categoryId: "cat-1",
              categoryName: "Groceries",
              memberId: null,
              memberName: null,
              installmentGroupId: null,
              installmentNumber: null,
              installmentTotal: null,
              createdAt: "2026-07-01T10:00:00Z",
              updatedAt: "2026-07-01T10:00:00Z",
            },
          ],
          page: 0,
          size: 12,
          totalItems: 1,
          totalPages: 1,
        });
      }
      return mockJsonResponse(defaultTransactionsResponse);
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: /Groceries/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("transactions.new") }));
    const drawer = screen.getByRole("dialog");

    fireEvent.click(within(drawer).getByRole("radio", { name: "Receita" }));
    fireEvent.change(within(drawer).getByLabelText(t("transactions.description")), {
      target: { value: "Gro" },
    });

    await waitFor(() => {
      expect(within(screen.getByTestId("transaction-description-suggestions")).getByText("Groceries monthly")).toBeInTheDocument();
    });

    fireEvent.change(within(drawer).getByLabelText(t("transactions.amount")), {
      target: { value: "90" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("transactions.transactionDate")), {
      target: { value: "2026-07-03" },
    });
    fireEvent.change(
      within(drawer).getByLabelText(t("common.account"), {
        selector: "#transaction-account",
      }),
      {
        target: { value: "account-1" },
      },
    );
    selectCategory(drawer, "Groceries");

    fireEvent.click(within(drawer).getByRole("button", { name: t("transactions.saveAndCreateNew") }));

    await waitFor(() => {
      expect(within(drawer).getByLabelText(t("transactions.description"))).toHaveValue("");
    });

    expect(within(drawer).getByRole("radio", { name: "Receita" })).toHaveAttribute("aria-checked", "true");
    expect(within(drawer).getByLabelText(t("transactions.transactionDate"))).toHaveValue("2026-07-03");
    expect(
      within(drawer).getByLabelText(t("common.account"), {
        selector: "#transaction-account",
      }),
    ).toHaveValue("account-1");
    expect(within(drawer).getByText("Groceries")).toBeInTheDocument();
  });

  it("sends only the supported payload for an income transaction", async () => {
    resetFetchMocks();

    setupDefaultMocks();

    mockFetchUrl(
      "/api/transactions",
      mockJsonResponse([
        {
          id: "tx-created",
          type: "INCOME",
          ownershipType: "SHARED",
          sourceType: "MANUAL",
          description: "A",
          amount: 90,
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
      ]),
    );

    // Mock reload after create
    mockFetchUrl("/api/transactions?", (input) => {
      const url = String(input);
      if (vi.mocked(fetch).mock.calls.filter(([u]) => String(u).includes("/api/transactions") && u !== url).length > 5) {
        return mockJsonResponse({
          items: [
            {
              ...defaultTransactionsResponse.items[0],
              id: "tx-created",
              description: "A",
              amount: 90,
              type: "INCOME",
            },
          ],
          ...defaultTransactionsResponse,
        });
      }
      return mockJsonResponse(defaultTransactionsResponse);
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: /Groceries/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("transactions.new") }));
    const drawer = screen.getByRole("dialog");

    fireEvent.click(within(drawer).getByRole("radio", { name: "Receita" }));
    fireEvent.change(within(drawer).getByLabelText(t("transactions.description")), {
      target: { value: "A" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("transactions.amount")), {
      target: { value: "90" },
    });
    fireEvent.change(
      within(drawer).getByLabelText(t("common.account"), {
        selector: "#transaction-account",
      }),
      {
        target: { value: "account-1" },
      },
    );
    selectCategory(drawer, "Groceries");

    fireEvent.click(within(drawer).getByRole("button", { name: t("transactions.save") }));

    await waitFor(() => {
      expect(
        vi.mocked(fetch).mock.calls.some(([input, init]) => String(input).endsWith("/api/transactions") && init?.method === "POST"),
      ).toBe(true);
    });

    const createCall = vi
      .mocked(fetch)
      .mock.calls.find(([input, init]) => String(input).endsWith("/api/transactions") && init?.method === "POST");
    const payload = JSON.parse(String(createCall?.[1]?.body ?? "{}")) as Record<string, unknown>;

    expect(payload).toMatchObject({
      type: "INCOME",
      ownershipType: "SHARED",
      description: "A",
      amount: 0.9,
      transactionDate: expect.any(String),
      accountId: "account-1",
      categoryId: "cat-1",
    });
    expect(payload).not.toHaveProperty("memberId");
    expect(payload).not.toHaveProperty("installmentCount");
  });

  it("sends member and installmentCount only when the expense requires them", async () => {
    resetFetchMocks();

    setupDefaultMocks();

    mockFetchUrl(
      "/api/transactions",
      mockJsonResponse([
        {
          id: "tx-created",
          type: "EXPENSE",
          ownershipType: "INDIVIDUAL",
          sourceType: "INSTALLMENT",
          description: "A",
          amount: 25,
          transactionDate: "2026-06-10",
          referenceMonth: "2026-06-01",
          accountId: "account-1",
          accountName: "Main checking",
          categoryId: "cat-1",
          categoryName: "Groceries",
          memberId: "member-1",
          memberName: "Taylor",
          installmentGroupId: "grp-1",
          installmentNumber: 1,
          installmentTotal: 4,
          createdAt: "2026-06-01T10:00:00Z",
          updatedAt: "2026-06-01T10:00:00Z",
        },
      ]),
    );

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: /Groceries/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("transactions.new") }));
    const drawer = screen.getByRole("dialog");

    fireEvent.change(within(drawer).getByLabelText(t("transactions.description")), {
      target: { value: "A" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("transactions.amount")), {
      target: { value: "100" },
    });
    fireEvent.change(
      within(drawer).getByLabelText(t("common.account"), {
        selector: "#transaction-account",
      }),
      {
        target: { value: "account-1" },
      },
    );
    selectCategory(drawer, "Groceries");
    fireEvent.click(within(drawer).getByRole("switch", { name: `${t("common.ownership")} ${t("ownershipTypes.INDIVIDUAL")}` }));
    fireEvent.change(within(drawer).getByLabelText(t("common.member")), {
      target: { value: "member-1" },
    });
    fireEvent.click(within(drawer).getByRole("switch", { name: /Parcelado/ }));
    fireEvent.change(within(drawer).getByLabelText("Quantidade de parcelas"), {
      target: { value: "4" },
    });

    fireEvent.click(within(drawer).getByRole("button", { name: t("transactions.save") }));

    await waitFor(() => {
      expect(
        vi.mocked(fetch).mock.calls.some(([input, init]) => String(input).endsWith("/api/transactions") && init?.method === "POST"),
      ).toBe(true);
    });

    const createCall = vi
      .mocked(fetch)
      .mock.calls.find(([input, init]) => String(input).endsWith("/api/transactions") && init?.method === "POST");
    const payload = JSON.parse(String(createCall?.[1]?.body ?? "{}")) as Record<string, unknown>;

    expect(payload).toMatchObject({
      type: "EXPENSE",
      ownershipType: "INDIVIDUAL",
      description: "A",
      amount: 1,
      accountId: "account-1",
      categoryId: "cat-1",
      memberId: "member-1",
      installmentCount: 4,
    });
  });

  it("opens a delete confirmation modal and cancels without calling the API", async () => {
    setupDefaultMocks();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const transactionButton = await screen.findByRole("button", { name: /Groceries/i });

    fireEvent.click(transactionButton);

    expect(screen.queryByRole("alertdialog", { name: t("transactions.deleteTitle") })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("common.delete") }));

    const modal = screen.getByRole("alertdialog", {
      name: t("transactions.deleteTitle"),
    });
    expect(within(modal).getByText(t("transactions.deleteSingleSubtitle"))).toBeInTheDocument();

    fireEvent.click(within(modal).getByRole("button", { name: t("common.cancel") }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog", { name: t("transactions.deleteTitle") })).not.toBeInTheDocument();
    });
    expect(
      vi.mocked(fetch).mock.calls.some(([input, init]) => String(input).includes("/api/transactions/tx-1?") && init?.method === "DELETE"),
    ).toBe(false);
  });

  it("confirms simple transaction deletion with SINGLE scope", async () => {
    resetFetchMocks();

    setupDefaultMocks();

    mockFetchUrl("/api/transactions/tx-1?", (input, init) => {
      if (init?.method === "DELETE") {
        return mockJsonResponse(undefined);
      }
      return mockErrorResponse(404);
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const transactionButton = await screen.findByRole("button", { name: /Groceries/i });

    fireEvent.click(transactionButton);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    const modal = screen.getByRole("alertdialog", {
      name: "Excluir transação",
    });
    fireEvent.click(within(modal).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(
        vi
          .mocked(fetch)
          .mock.calls.some(([input, init]) => String(input).endsWith("/api/transactions/tx-1?scope=SINGLE") && init?.method === "DELETE"),
      ).toBe(true);
    });
  });

  it("confirms grouped transaction deletion with FUTURE and ALL scopes", async () => {
    resetFetchMocks();

    const groupedTransaction = {
      id: "tx-1",
      type: "EXPENSE",
      ownershipType: "SHARED",
      sourceType: "INSTALLMENT",
      description: "Groceries",
      amount: 25,
      transactionDate: "2026-06-10",
      referenceMonth: "2026-06-01",
      accountId: "account-1",
      accountName: "Main checking",
      categoryId: "cat-1",
      categoryName: "Groceries",
      memberId: null,
      memberName: null,
      installmentGroupId: "grp-1",
      installmentNumber: 2,
      installmentTotal: 4,
      createdAt: "2026-06-01T10:00:00Z",
      updatedAt: "2026-06-01T10:00:00Z",
    };

    mockFetchUrl(
      "/api/transactions?",
      mockJsonResponse({
        items: [groupedTransaction],
        page: 0,
        size: 12,
        totalItems: 1,
        totalPages: 1,
      }),
    );
    mockFetchUrl("/api/accounts?", mockJsonResponse(defaultAccountsResponse));
    mockFetchUrl("/api/categories/options", mockJsonResponse(defaultCategoriesResponse));
    mockFetchUrl("/api/family-members", mockJsonResponse(defaultMembersResponse));
    mockFetchUrl("/api/transactions/descriptions", mockJsonResponse([]));
    mockFetchUrl("/api/transactions/tx-1?", mockJsonResponse(undefined));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const transactionButton = await screen.findByRole("button", { name: /Groceries/i });

    fireEvent.click(transactionButton);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    let modal = screen.getByRole("alertdialog", { name: "Excluir transação" });
    expect(within(modal).getByLabelText("Escopo da exclusão")).toBeInTheDocument();
    fireEvent.change(within(modal).getByLabelText("Escopo da exclusão"), {
      target: { value: "FUTURE" },
    });
    fireEvent.click(within(modal).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(
        vi
          .mocked(fetch)
          .mock.calls.some(([input, init]) => String(input).endsWith("/api/transactions/tx-1?scope=FUTURE") && init?.method === "DELETE"),
      ).toBe(true);
    });

    fireEvent.click(transactionButton);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    modal = screen.getByRole("alertdialog", { name: "Excluir transação" });
    fireEvent.change(within(modal).getByLabelText("Escopo da exclusão"), {
      target: { value: "ALL" },
    });
    fireEvent.click(within(modal).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(
        vi
          .mocked(fetch)
          .mock.calls.some(([input, init]) => String(input).endsWith("/api/transactions/tx-1?scope=ALL") && init?.method === "DELETE"),
      ).toBe(true);
    });
  });

  it("shows projected fixed transactions without allowing edit from the transaction list", async () => {
    resetFetchMocks();

    const futureReferenceMonth = shiftReferenceMonth(getCurrentReferenceMonth(), 1);

    mockFetchUrl(
      "/api/transactions?",
      mockJsonResponse({
        items: [
          {
            id: "projected-rent",
            type: "EXPENSE",
            ownershipType: "SHARED",
            sourceType: "FIXED_EXPENSE",
            description: "Projected Rent",
            amount: 880,
            transactionDate: `${futureReferenceMonth.slice(0, 8)}12`,
            referenceMonth: futureReferenceMonth,
            accountId: "account-1",
            accountName: "Main checking",
            categoryId: "cat-1",
            categoryName: "Groceries",
            memberId: null,
            memberName: null,
            installmentGroupId: null,
            installmentNumber: null,
            installmentTotal: null,
            fixedExpenseTemplateId: "template-1",
            projected: true,
            createdAt: null,
            updatedAt: null,
          },
        ],
        page: 0,
        size: 12,
        totalItems: 1,
        totalPages: 1,
      }),
    );
    mockFetchUrl("/api/accounts?", mockJsonResponse(defaultAccountsResponse));
    mockFetchUrl("/api/categories/options", mockJsonResponse(defaultCategoriesResponse));
    mockFetchUrl(
      "/api/family-members",
      mockJsonResponse({
        items: [],
        page: 0,
        size: 200,
        totalItems: 0,
        totalPages: 0,
      }),
    );
    mockFetchUrl("/api/transactions/descriptions", mockJsonResponse([]));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Projected Rent")).toBeInTheDocument();
    expect(screen.getByText("Prevista")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Projected Rent/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Projected Rent"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lets the user move to previous and next months and highlights non-current months", async () => {
    resetFetchMocks();

    const currentReferenceMonth = getCurrentReferenceMonth();
    const previousReferenceMonth = shiftReferenceMonth(currentReferenceMonth, -1);

    mockFetchUrl("/api/transactions?", (input) => {
      const url = String(input);
      const referenceMonth = url.includes("referenceMonth=") ? new URL(url).searchParams.get("referenceMonth") : null;

      return mockJsonResponse({
        items:
          referenceMonth === previousReferenceMonth
            ? []
            : [
                {
                  id: "tx-1",
                  type: "EXPENSE",
                  ownershipType: "SHARED",
                  sourceType: "MANUAL",
                  description: "Groceries",
                  amount: 125.5,
                  transactionDate: "2026-06-10",
                  referenceMonth: currentReferenceMonth,
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
        totalItems: referenceMonth === previousReferenceMonth ? 0 : 1,
        totalPages: 1,
      });
    });

    mockFetchUrl(
      "/api/accounts?",
      mockJsonResponse([
        {
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
        },
      ]),
    );

    mockFetchUrl("/api/categories/options", (input) => {
      const url = String(input);
      const referenceMonth = url.includes("referenceMonth=") ? new URL(url).searchParams.get("referenceMonth") : null;

      return mockJsonResponse(
        referenceMonth === previousReferenceMonth
          ? []
          : [
              {
                id: "cat-1",
                name: "Groceries",
                icon: "shopping-cart",
                color: "#2254d1",
              },
              {
                id: "cat-2",
                name: "Transport",
                icon: "car",
                color: "#14a44d",
              },
            ],
      );
    });

    mockFetchUrl("/api/family-members", mockJsonResponse(defaultMembersResponse));
    mockFetchUrl("/api/transactions/descriptions", mockJsonResponse([]));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(t("common.loadedItems", { loaded: 1, total: 1 }))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("common.previousMonth") }));

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).includes(`referenceMonth=${previousReferenceMonth}`))).toBe(true);
    });

    fireEvent.click(screen.getByRole("button", { name: t("common.nextMonth") }));

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).includes(`referenceMonth=${currentReferenceMonth}`))).toBe(true);
    });

    expect(
      vi.mocked(fetch).mock.calls.filter(([input]) => String(input).includes(`referenceMonth=${currentReferenceMonth}`)).length,
    ).toBeGreaterThan(0);
  });

  it("derives the initial transaction date from the selected reference month when opening the creation form", async () => {
    resetFetchMocks();

    const currentReferenceMonth = getCurrentReferenceMonth();
    const previousReferenceMonth = shiftReferenceMonth(currentReferenceMonth, -1);

    mockFetchUrl("/api/transactions?", (input) => {
      const url = String(input);
      const referenceMonth = url.includes("referenceMonth=") ? new URL(url).searchParams.get("referenceMonth") : null;

      return mockJsonResponse({
        items:
          referenceMonth === previousReferenceMonth
            ? []
            : [
                {
                  id: "tx-1",
                  type: "EXPENSE",
                  ownershipType: "SHARED",
                  sourceType: "MANUAL",
                  description: "Groceries",
                  amount: 125.5,
                  transactionDate: "2026-06-10",
                  referenceMonth: currentReferenceMonth,
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
        totalItems: referenceMonth === previousReferenceMonth ? 0 : 1,
        totalPages: 1,
      });
    });

    mockFetchUrl(
      "/api/accounts?",
      mockJsonResponse([
        {
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
        },
      ]),
    );

    mockFetchUrl("/api/categories/options", (input) => {
      const url = String(input);
      const referenceMonth = url.includes("referenceMonth=") ? new URL(url).searchParams.get("referenceMonth") : null;

      return mockJsonResponse(
        referenceMonth === previousReferenceMonth
          ? []
          : [
              {
                id: "cat-1",
                name: "Groceries",
                icon: "shopping-cart",
                color: "#2254d1",
              },
              {
                id: "cat-2",
                name: "Transport",
                icon: "car",
                color: "#14a44d",
              },
            ],
      );
    });

    mockFetchUrl("/api/family-members", mockJsonResponse(defaultMembersResponse));
    mockFetchUrl("/api/transactions/descriptions", mockJsonResponse([]));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(t("common.loadedItems", { loaded: 1, total: 1 }))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("common.previousMonth") }));

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).includes(`referenceMonth=${previousReferenceMonth}`))).toBe(true);
    });

    fireEvent.click(screen.getByRole("button", { name: t("transactions.new") }));

    const drawer = screen.getByRole("dialog");
    const dateInput = within(drawer).getByLabelText(t("transactions.transactionDate"));

    await waitFor(() => {
      expect(dateInput).toHaveValue(previousReferenceMonth);
    });
  });

  it("filters transactions by multiple categories without expanding the active chip list", async () => {
    resetFetchMocks();

    setupDefaultMocks();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(t("common.loadedItems", { loaded: 1, total: 1 }))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("common.filters") }));
    fireEvent.click(screen.getByLabelText(t("common.categories"), { selector: "button" }));

    const listbox = screen.getByRole("listbox");
    fireEvent.click(within(listbox).getByRole("option", { name: /Groceries/i }));
    fireEvent.click(within(listbox).getByRole("option", { name: /Transport/i }));
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${t("common.filters")}`) }));

    await waitFor(() => {
      expect(screen.getByText(`${t("common.categories")}: Groceries, Transport`)).toBeInTheDocument();
    });

    const transactionRequests = vi
      .mocked(fetch)
      .mock.calls.map(([input]) => String(input))
      .filter((url) => url.includes("/api/transactions?"));

    expect(transactionRequests.some((url) => url.includes("categoryIds=cat-1") && url.includes("categoryIds=cat-2"))).toBe(true);
  });

  it("filters transactions by search term and shows an active filter chip", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/transactions?",
      mockJsonResponse({
        items: [],
        page: 0,
        size: 12,
        totalItems: 0,
        totalPages: 0,
      }),
    );
    mockFetchUrl("/api/accounts", mockJsonResponse([]));
    mockFetchUrl("/api/categories/options", mockJsonResponse([]));
    mockFetchUrl(
      "/api/family-members",
      mockJsonResponse({
        items: [],
        page: 0,
        size: 200,
        totalItems: 0,
        totalPages: 0,
      }),
    );
    mockFetchUrl("/api/transactions/descriptions", mockJsonResponse([]));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const searchInput = await screen.findByLabelText(t("common.search"));
    fireEvent.change(searchInput, { target: { value: "mercado" } });

    await waitFor(() => {
      const requests = vi
        .mocked(fetch)
        .mock.calls.map(([input]) => String(input))
        .filter((url) => url.includes("/api/transactions?"));
      expect(requests.some((url) => url.includes("search=mercado"))).toBe(true);
    });

    expect(screen.getByText("Buscar: mercado")).toBeInTheDocument();
  });

  it("shows error feedback when delete fails", async () => {
    resetFetchMocks();

    setupDefaultMocks();

    mockFetchUrl("/api/transactions/tx-1?", (input, init) => {
      if (init?.method === "DELETE") {
        return mockErrorResponse(500, "Server error");
      }
      return mockErrorResponse(404);
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: true,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const transactionButton = await screen.findByRole("button", { name: /Groceries/i });

    fireEvent.click(transactionButton);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    const modal = screen.getByRole("alertdialog", {
      name: "Excluir transação",
    });
    fireEvent.click(within(modal).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(screen.getByText("Não foi possível excluir a transação.")).toBeInTheDocument();
    });
  });

  it("shows USD secondary line for foreign currency transactions", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/transactions?",
      mockJsonResponse({
        items: [
          {
            id: "tx-usd",
            type: "EXPENSE",
            ownershipType: "SHARED",
            sourceType: "MANUAL",
            description: "Amazon",
            amount: 100,
            convertedAmount: 510,
            exchangeRate: 5.1,
            currency: "USD",
            transactionDate: "2026-06-10",
            referenceMonth: "2026-06-01",
            accountId: "account-1",
            accountName: "US Account",
            categoryId: "cat-1",
            categoryName: "Shopping",
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
      }),
    );
    mockFetchUrl(
      "/api/accounts?",
      mockJsonResponse({
        items: [
          {
            id: "account-1",
            name: "US Account",
            type: "CHECKING",
            currency: "USD",
            brand: null,
            color: "#2254d1",
            closingDay: null,
            dueDay: null,
            createdInMonth: "2026-06-01",
            archivedFromMonth: null,
            createdAt: "2026-06-01T10:00:00Z",
            updatedAt: "2026-06-01T10:00:00Z",
          },
        ],
        page: 0,
        size: 200,
        totalItems: 1,
        totalPages: 1,
      }),
    );
    mockFetchUrl(
      "/api/categories/options",
      mockJsonResponse([
        {
          id: "cat-1",
          name: "Shopping",
          icon: "shopping-cart",
          color: "#2254d1",
        },
      ]),
    );
    mockFetchUrl(
      "/api/family-members",
      mockJsonResponse({
        items: [],
        page: 0,
        size: 200,
        totalItems: 0,
        totalPages: 0,
      }),
    );
    mockFetchUrl("/api/transactions/descriptions", mockJsonResponse([]));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Amazon")).toBeInTheDocument();
    expect(screen.getByText(/cot\. R\$ 5,10/)).toBeInTheDocument();
  });

  it("loads USD originalAmount when editing a foreign currency transaction", async () => {
    resetFetchMocks();

    const usdTransaction = {
      id: "tx-usd",
      type: "EXPENSE" as const,
      ownershipType: "SHARED" as const,
      sourceType: "MANUAL" as const,
      description: "Amazon",
      amount: 100,
      convertedAmount: 510,
      exchangeRate: 5.1,
      currency: "USD",
      transactionDate: "2026-06-10",
      referenceMonth: "2026-06-01",
      accountId: "account-1",
      accountName: "US Account",
      categoryId: "cat-1",
      categoryName: "Shopping",
      memberId: null,
      memberName: null,
      installmentGroupId: null,
      installmentNumber: null,
      installmentTotal: null,
      createdAt: "2026-06-01T10:00:00Z",
      updatedAt: "2026-06-01T10:00:00Z",
    };

    mockFetchUrl(
      "/api/transactions?",
      mockJsonResponse({
        items: [usdTransaction],
        page: 0,
        size: 12,
        totalItems: 1,
        totalPages: 1,
      }),
    );
    mockFetchUrl(
      "/api/accounts?",
      mockJsonResponse({
        items: [
          {
            id: "account-1",
            name: "US Account",
            type: "CHECKING" as const,
            currency: "USD",
            brand: null,
            color: "#2254d1",
            closingDay: null,
            dueDay: null,
            createdInMonth: "2026-06-01",
            archivedFromMonth: null,
            createdAt: "2026-06-01T10:00:00Z",
            updatedAt: "2026-06-01T10:00:00Z",
          },
        ],
        page: 0,
        size: 200,
        totalItems: 1,
        totalPages: 1,
      }),
    );
    mockFetchUrl(
      "/api/categories/options",
      mockJsonResponse([
        {
          id: "cat-1",
          name: "Shopping",
          icon: "shopping-cart",
          color: "#2254d1",
        },
      ]),
    );
    mockFetchUrl(
      "/api/family-members",
      mockJsonResponse({
        items: [],
        page: 0,
        size: 200,
        totalItems: 0,
        totalPages: 0,
      }),
    );
    mockFetchUrl("/api/transactions/descriptions", mockJsonResponse([]));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <TransactionsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    // Open the edit drawer by clicking the transaction
    const transactionButton = await screen.findByText("Amazon");
    fireEvent.click(transactionButton.closest("button")!);

    // The amount field should show the USD value (100), not the BRL value (510)
    const amountInput = screen.getByLabelText("Valor");
    expect(amountInput).toHaveValue("$100.00");
  });
});
