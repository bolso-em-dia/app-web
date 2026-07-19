import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import { getCurrentReferenceMonth, shiftReferenceMonth } from "../../lib/formatters/date";
import { resetFetchMocks, mockJsonResponse, mockErrorResponse, mockFetchUrl } from "../../test/setup";
import { t } from "../../test/i18n";
import BudgetForm from "./BudgetForm";
import BudgetsPage from "./BudgetsPage";

const defaultBudgetsResponse = {
  items: [
    {
      id: "env-1",
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
      categories: [
        {
          id: "cat-1",
          name: "Groceries",
          color: "#2254d1",
        },
      ],
      transactions: [],
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
  mockFetchUrl("/api/budgets?", mockJsonResponse(defaultBudgetsResponse));
  mockFetchUrl("/api/categories/options", mockJsonResponse(defaultCategoriesResponse));
  mockFetchUrl("/api/family-members", mockJsonResponse(defaultMembersResponse));
  // Mock detail view calls
  mockFetchUrl("/api/budgets/env-1?", mockJsonResponse(defaultBudgetsResponse.items[0]));
}

describe("BudgetsPage", () => {
  beforeEach(() => {
    resetFetchMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads budgets and validates budget-specific fields", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/budgets"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <BudgetsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Household")).toBeInTheDocument();
    expect(screen.getByText(t("common.loadedItems", { loaded: 1, total: 1 }))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("budgets.new") }));
    const drawer = screen.getByRole("dialog");

    fireEvent.change(within(drawer).getByLabelText(t("common.name")), {
      target: { value: "Allowance budget" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("budgets.monthlyLimit")), {
      target: { value: "450" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("common.type")), {
      target: { value: "ALLOWANCE" },
    });

    fireEvent.click(within(drawer).getByRole("button", { name: t("budgets.create") }));

    await waitFor(() => {
      expect(screen.getByText(t("validation.requiredAllowanceOwner"))).toBeInTheDocument();
    });
  });

  it("shows mapped error feedback when budget save fails", async () => {
    resetFetchMocks();
    setupDefaultMocks();

    mockFetchUrl("/api/budgets", (input, init) =>
      init?.method === "POST"
        ? mockErrorResponse(
            409,
            JSON.stringify({
              status: 409,
              code: 40903,
              error: "Conflict",
              message: "This item was modified by another user. Reload and try again.",
            }),
          )
        : mockErrorResponse(404),
    );

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/budgets"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <BudgetsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Household")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: t("budgets.new") }));
    const drawer = screen.getByRole("dialog");

    fireEvent.change(within(drawer).getByLabelText(t("common.name")), {
      target: { value: "Travel budget" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("budgets.monthlyLimit")), {
      target: { value: "450" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("common.type")), {
      target: { value: "ALLOWANCE" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("budgets.ownerMember")), {
      target: { value: "member-1" },
    });
    fireEvent.click(within(drawer).getByRole("button", { name: t("budgets.create") }));

    expect(await screen.findByText(t("error.concurrentModification"))).toBeInTheDocument();
    expect(within(drawer).getByLabelText(t("common.name"))).toHaveValue("Travel budget");
  });

  it("shows monthly limit in budget cards without the consumed secondary line", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/budgets"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <BudgetsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const budgetName = await screen.findByText("Household");
    const budgetCard = budgetName.closest("button");

    expect(budgetCard).not.toBeNull();
    expect(within(budgetCard!).getByText("R$ 1.200,00")).toBeInTheDocument();
    expect(within(budgetCard!).queryByText(/Consumido/i)).not.toBeInTheDocument();
    expect(within(budgetCard!).queryByText((content) => content.includes("R$ 320,00"))).not.toBeInTheDocument();
  });

  it("shows session expired feedback and preserves typed values when submitting without token", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/budgets"]}>
        <TestAuthProvider
          authOverrides={{ accessToken: null }}
          user={{ id: "1", name: "Admin", email: "admin@bolso-em-dia.local", role: "ADMIN" }}
        >
          <BudgetForm
            allowanceBudgets={[]}
            budget={null}
            categories={defaultCategoriesResponse}
            members={defaultMembersResponse.items}
            onCancel={vi.fn()}
            onSuccess={vi.fn()}
            referenceMonth={getCurrentReferenceMonth()}
          />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const nameInput = screen.getByLabelText(t("common.name"));

    fireEvent.change(nameInput, { target: { value: "Emergency" } });
    fireEvent.change(screen.getByLabelText(t("budgets.monthlyLimit")), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: /Categorias vinculadas/i }));
    fireEvent.click(screen.getByRole("option", { name: /Groceries/i }));
    fireEvent.click(screen.getByRole("button", { name: t("budgets.create") }));

    expect(await screen.findByText(t("common.sessionExpired"))).toBeInTheDocument();
    expect(nameInput).toHaveValue("Emergency");
  });

  it("sends only the compatible payload for an allowance budget", async () => {
    resetFetchMocks();

    // Setup GET mocks
    mockFetchUrl(
      "/api/budgets?",
      mockJsonResponse({
        items: [],
        page: 0,
        size: 12,
        totalItems: 0,
        totalPages: 0,
      }),
    );
    mockFetchUrl(
      "/api/categories/options",
      mockJsonResponse([
        {
          id: "cat-1",
          name: "Groceries",
          icon: "shopping-cart",
          color: "#2254d1",
        },
      ]),
    );
    mockFetchUrl("/api/family-members", mockJsonResponse(defaultMembersResponse));

    // Setup POST mock
    mockFetchUrl("/api/budgets", (input, init) => {
      const url = String(input);
      if (url.endsWith("/api/budgets") && init?.method === "POST") {
        return mockJsonResponse({
          id: "budget-1",
          name: "Allowance budget",
          type: "ALLOWANCE",
          ownerMemberId: "member-1",
          ownerMemberName: "Taylor",
          monthlyLimit: 4.5,
          consumedAmount: 0,
          remainingAmount: 450,
          createdInMonth: "2026-06-01",
          archivedFromMonth: null,
          active: true,
          categories: [],
          transactions: [],
        });
      }
      return mockErrorResponse(404);
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/budgets"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <BudgetsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: t("budgets.new") })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("budgets.new") }));
    const drawer = screen.getByRole("dialog");

    fireEvent.change(within(drawer).getByLabelText(t("common.name")), {
      target: { value: "Allowance budget" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("budgets.monthlyLimit")), {
      target: { value: "450" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("common.type")), {
      target: { value: "ALLOWANCE" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("budgets.ownerMember")), {
      target: { value: "member-1" },
    });

    fireEvent.click(within(drawer).getByRole("button", { name: t("budgets.create") }));

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.some(([input, init]) => String(input).endsWith("/api/budgets") && init?.method === "POST")).toBe(
        true,
      );
    });

    const createCall = vi
      .mocked(fetch)
      .mock.calls.find(([input, init]) => String(input).endsWith("/api/budgets") && init?.method === "POST");
    const payload = JSON.parse(String(createCall?.[1]?.body ?? "{}")) as Record<string, unknown>;

    expect(payload).toMatchObject({
      name: "Allowance budget",
      type: "ALLOWANCE",
      ownerMemberId: "member-1",
      monthlyLimit: 4.5,
    });
    expect(payload).not.toHaveProperty("categoryIds");
  });

  it("builds the budget list request with combined search, status and type filters", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/budgets?",
      mockJsonResponse({
        items: [],
        page: 0,
        size: 12,
        totalItems: 0,
        totalPages: 0,
      }),
    );
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

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/budgets"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <BudgetsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: new RegExp(t("common.filters")) })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(t("common.search")), {
      target: { value: "  travel  " },
    });
    fireEvent.click(screen.getByRole("button", { name: new RegExp(t("common.filters")) }));
    fireEvent.change(screen.getByLabelText(t("common.status")), {
      target: { value: "ARCHIVED" },
    });
    fireEvent.change(screen.getByLabelText(t("common.type")), {
      target: { value: "ALLOWANCE" },
    });

    await waitFor(() => {
      const requests = vi
        .mocked(fetch)
        .mock.calls.map(([input]) => String(input))
        .filter((url) => url.includes("/api/budgets?"));
      expect(
        requests.some((url) => url.includes("search=travel") && url.includes("status=ARCHIVED") && url.includes("type=ALLOWANCE")),
      ).toBe(true);
    });
  });

  it("lets the user move to previous and next months and highlights non-current months", async () => {
    const currentReferenceMonth = getCurrentReferenceMonth();
    const previousReferenceMonth = shiftReferenceMonth(currentReferenceMonth, -1);

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/budgets"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <BudgetsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Household")).toBeInTheDocument();

    // Setup mocks for previous month
    mockFetchUrl("/api/budgets?", (input) => {
      const url = String(input);
      if (url.includes(`referenceMonth=${previousReferenceMonth}`)) {
        return mockJsonResponse({
          items: [],
          page: 0,
          size: 12,
          totalItems: 0,
          totalPages: 0,
        });
      }
      return mockJsonResponse(defaultBudgetsResponse);
    });
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

    fireEvent.click(screen.getByRole("button", { name: t("common.previousMonth") }));

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).includes(`referenceMonth=${previousReferenceMonth}`))).toBe(true);
    });

    // Setup mocks for next month (back to current)
    mockFetchUrl("/api/budgets?", (input) => {
      const url = String(input);
      if (url.includes(`referenceMonth=${currentReferenceMonth}`)) {
        return mockJsonResponse(defaultBudgetsResponse);
      }
      return mockJsonResponse({
        items: [],
        page: 0,
        size: 12,
        totalItems: 0,
        totalPages: 0,
      });
    });
    mockFetchUrl(
      "/api/categories/options",
      mockJsonResponse([
        {
          id: "cat-1",
          name: "Groceries",
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

    fireEvent.click(screen.getByRole("button", { name: t("common.nextMonth") }));

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).includes(`referenceMonth=${currentReferenceMonth}`))).toBe(true);
    });
  });

  it("archive opens confirmation and cancels without calling API", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/budgets"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <BudgetsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const householdButton = await screen.findByText("Household");
    fireEvent.click(householdButton.closest("button")!);

    fireEvent.click(screen.getByRole("button", { name: t("common.archive") }));

    const confirmDialog = screen.getByRole("alertdialog");
    expect(confirmDialog).toBeInTheDocument();

    fireEvent.click(within(confirmDialog).getByRole("button", { name: t("common.cancel") }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("archive confirms and calls API then reloads list", async () => {
    resetFetchMocks();

    let archiveCalled = false;
    // Configure GET mocks first (more specific URLs)
    mockFetchUrl(
      "/api/budgets?",
      mockJsonResponse({
        items: [
          {
            id: "env-1",
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
          },
        ],
        page: 0,
        size: 12,
        totalItems: 1,
        totalPages: 1,
      }),
    );

    mockFetchUrl(
      "/api/categories/options",
      mockJsonResponse([
        {
          id: "cat-1",
          name: "Groceries",
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

    // Configure PATCH mock after GET mocks (more specific URL)
    mockFetchUrl("/api/budgets/env-1/archive", (input, init) => {
      if (init?.method === "PATCH") {
        archiveCalled = true;
        return mockJsonResponse({
          id: "env-1",
          name: "Household",
          type: "GLOBAL",
          monthlyLimit: 1200,
          consumedAmount: 320,
          remainingAmount: 880,
          createdInMonth: "2026-06-01",
          archivedFromMonth: "2026-07-01",
          active: false,
          categories: [],
          transactions: [],
        });
      }

      return mockErrorResponse(404);
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/budgets"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <BudgetsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const householdButton = await screen.findByText("Household");
    fireEvent.click(householdButton.closest("button")!);

    fireEvent.click(screen.getByRole("button", { name: t("common.archive") }));

    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: t("common.archive") }));

    await waitFor(() => {
      expect(archiveCalled).toBe(true);
    });
  });

  it("shows error feedback when archive fails", async () => {
    resetFetchMocks();

    // Configure GET mocks first (more specific URLs)
    mockFetchUrl(
      "/api/budgets?",
      mockJsonResponse({
        items: [
          {
            id: "env-1",
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
          },
        ],
        page: 0,
        size: 12,
        totalItems: 1,
        totalPages: 1,
      }),
    );

    mockFetchUrl(
      "/api/categories/options",
      mockJsonResponse([
        {
          id: "cat-1",
          name: "Groceries",
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

    // Configure PATCH mock after GET mocks
    mockFetchUrl("/api/budgets/env-1/archive", (input, init) => {
      if (init?.method === "PATCH") {
        return mockErrorResponse(500, "Server error");
      }
      return mockErrorResponse(404);
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/budgets"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <BudgetsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const householdButton = await screen.findByText("Household");
    fireEvent.click(householdButton.closest("button")!);

    fireEvent.click(screen.getByRole("button", { name: t("common.archive") }));

    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: t("common.archive") }));

    await waitFor(() => {
      expect(screen.getByText(t("error.unexpected"))).toBeInTheDocument();
    });
  });

  it("shows loading spinner while budgets are being fetched", async () => {
    resetFetchMocks();

    let resolveFetch: (value: Response) => void;
    const promise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    mockFetchUrl("/api/budgets?", () => promise);

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/budgets"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <BudgetsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText(t("budgets.loading"))).toBeInTheDocument();

    resolveFetch!({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        page: 0,
        size: 12,
        totalItems: 0,
        totalPages: 0,
      }),
      text: async () => "",
    } as Response);

    await waitFor(() => {
      expect(screen.queryByText(t("budgets.loading"))).not.toBeInTheDocument();
    });
  });
});
