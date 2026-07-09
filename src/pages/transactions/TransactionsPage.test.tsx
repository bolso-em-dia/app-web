import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import { getCurrentReferenceMonth, shiftReferenceMonth } from "../../lib/formatters/date";
import TransactionsPage from "./TransactionsPage";

function jsonResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => "",
  } as Response;
}

function queueInitialLoads() {
  vi.mocked(fetch)
    .mockResolvedValueOnce(
      jsonResponse({
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
      }),
    )
    .mockResolvedValueOnce(
      jsonResponse({
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
      }),
    )
    .mockResolvedValueOnce(
      jsonResponse([
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
      ]),
    )
    .mockResolvedValueOnce(
      jsonResponse({
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
      }),
    );
}

function selectCategory(container: HTMLElement, categoryName: string) {
  fireEvent.click(
    within(container).getByLabelText("Categoria", { selector: "button" }),
  );
  fireEvent.click(
    within(container).getByRole("option", { name: new RegExp(categoryName, "i") }),
  );
}

describe("TransactionsPage", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads transactions and validates member selection for individual ownership", async () => {
    queueInitialLoads();

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

    expect(
      await screen.findByRole("button", { name: /Groceries/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("1-1 de 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nova transação" }));
    const drawer = screen.getByRole("dialog");

    fireEvent.change(within(drawer).getByLabelText("Descrição"), {
      target: { value: "A" },
    });
    fireEvent.change(within(drawer).getByLabelText("Valor"), {
      target: { value: "45" },
    });
    fireEvent.change(
      within(drawer).getByLabelText("Conta", {
        selector: "#transaction-account",
      }),
      {
        target: { value: "account-1" },
      },
    );
    selectCategory(drawer, "Groceries");
    fireEvent.click(
      within(drawer).getByRole("switch", { name: "Titularidade Individual" }),
    );

    fireEvent.click(
      within(drawer).getByRole("button", { name: "Salvar e criar novo" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("O membro é obrigatório para transações individuais."),
      ).toBeInTheDocument();
    });
  });

  it("shows description suggestions and preserves non-varying fields on save and create new", async () => {
    queueInitialLoads();
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(["Groceries", "Groceries monthly"]))
      .mockResolvedValueOnce(
        jsonResponse([
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
        ]),
      );
    queueInitialLoads();

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

    expect(
      await screen.findByRole("button", { name: /Groceries/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nova transação" }));
    const drawer = screen.getByRole("dialog");

    fireEvent.click(within(drawer).getByRole("radio", { name: "Receita" }));
    fireEvent.change(within(drawer).getByLabelText("Descrição"), {
      target: { value: "Gro" },
    });

    await waitFor(() => {
      expect(
        within(
          screen.getByTestId("transaction-description-suggestions"),
        ).getByText("Groceries monthly"),
      ).toBeInTheDocument();
    });

    fireEvent.change(within(drawer).getByLabelText("Valor"), {
      target: { value: "90" },
    });
    fireEvent.change(within(drawer).getByLabelText("Data da transação"), {
      target: { value: "2026-07-03" },
    });
    fireEvent.change(
      within(drawer).getByLabelText("Conta", {
        selector: "#transaction-account",
      }),
      {
        target: { value: "account-1" },
      },
    );
    selectCategory(drawer, "Groceries");

    fireEvent.click(
      within(drawer).getByRole("button", { name: "Salvar e criar novo" }),
    );

    await waitFor(() => {
      expect(within(drawer).getByLabelText("Descrição")).toHaveValue("");
    });

    expect(within(drawer).getByRole("radio", { name: "Receita" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(within(drawer).getByLabelText("Data da transação")).toHaveValue(
      "2026-07-03",
    );
    expect(
      within(drawer).getByLabelText("Conta", {
        selector: "#transaction-account",
      }),
    ).toHaveValue("account-1");
    expect(
      within(drawer).getByText("Groceries"),
    ).toBeInTheDocument();
  });

  it("sends only the supported payload for an income transaction", async () => {
    queueInitialLoads();
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse([
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
    queueInitialLoads();

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

    expect(await screen.findByRole("button", { name: /Groceries/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nova transação" }));
    const drawer = screen.getByRole("dialog");

    fireEvent.click(within(drawer).getByRole("radio", { name: "Receita" }));
    fireEvent.change(within(drawer).getByLabelText("Descrição"), {
      target: { value: "A" },
    });
    fireEvent.change(within(drawer).getByLabelText("Valor"), {
      target: { value: "90" },
    });
    fireEvent.change(
      within(drawer).getByLabelText("Conta", {
        selector: "#transaction-account",
      }),
      {
        target: { value: "account-1" },
      },
    );
    selectCategory(drawer, "Groceries");

    fireEvent.click(within(drawer).getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(
        vi
          .mocked(fetch)
          .mock.calls.some(
            ([input, init]) =>
              String(input).endsWith("/api/transactions") && init?.method === "POST",
          ),
      ).toBe(true);
    });

    const createCall = vi.mocked(fetch).mock.calls.find(
      ([input, init]) =>
        String(input).endsWith("/api/transactions") && init?.method === "POST",
    );
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
    queueInitialLoads();
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse([
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
    queueInitialLoads();

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

    expect(await screen.findByRole("button", { name: /Groceries/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nova transação" }));
    const drawer = screen.getByRole("dialog");

    fireEvent.change(within(drawer).getByLabelText("Descrição"), {
      target: { value: "A" },
    });
    fireEvent.change(within(drawer).getByLabelText("Valor"), {
      target: { value: "100" },
    });
    fireEvent.change(
      within(drawer).getByLabelText("Conta", {
        selector: "#transaction-account",
      }),
      {
        target: { value: "account-1" },
      },
    );
    selectCategory(drawer, "Groceries");
    fireEvent.click(within(drawer).getByRole("switch", { name: "Titularidade Individual" }));
    fireEvent.change(within(drawer).getByLabelText("Membro"), {
      target: { value: "member-1" },
    });
    fireEvent.click(within(drawer).getByRole("switch", { name: /Parcelado/ }));
    fireEvent.change(within(drawer).getByLabelText("Quantidade de parcelas"), {
      target: { value: "4" },
    });

    fireEvent.click(within(drawer).getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(
        vi
          .mocked(fetch)
          .mock.calls.some(
            ([input, init]) =>
              String(input).endsWith("/api/transactions") && init?.method === "POST",
          ),
      ).toBe(true);
    });

    const createCall = vi.mocked(fetch).mock.calls.find(
      ([input, init]) =>
        String(input).endsWith("/api/transactions") && init?.method === "POST",
    );
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
    queueInitialLoads();

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

    const transactionLabel = await screen.findByText("Groceries");
    const transactionButton = transactionLabel.closest("button");
    if (!transactionButton) {
      throw new Error("Transaction button not found.");
    }

    fireEvent.click(transactionButton);

    expect(
      screen.queryByRole("dialog", { name: "Excluir transação" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Excluir transação" }));

    const modal = screen.getByRole("dialog", { name: "Excluir transação" });
    expect(within(modal).getByText("Confirme a exclusão da transação selecionada.")).toBeInTheDocument();

    fireEvent.click(within(modal).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Excluir transação" }),
      ).not.toBeInTheDocument();
    });
    expect(
      vi.mocked(fetch).mock.calls.some(
        ([input, init]) =>
          String(input).includes("/api/transactions/tx-1?") &&
          init?.method === "DELETE",
      ),
    ).toBe(false);
  });

  it("confirms simple transaction deletion with SINGLE scope", async () => {
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input);

      if (url.includes("/api/transactions?") && (!init?.method || init.method === "GET")) {
        return Promise.resolve(
          jsonResponse({
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
          }),
        );
      }

      if (url.includes("/api/accounts?")) {
        return Promise.resolve(
          jsonResponse({
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
          }),
        );
      }

      if (url.includes("/api/categories/options")) {
        return Promise.resolve(
          jsonResponse([
            {
              id: "cat-1",
              name: "Groceries",
              icon: "shopping-cart",
              color: "#2254d1",
            },
          ]),
        );
      }

      if (url.includes("/api/family-members")) {
        return Promise.resolve(
          jsonResponse({
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
          }),
        );
      }

      if (url.includes("/api/transactions/tx-1?") && init?.method === "DELETE") {
        return Promise.resolve(jsonResponse(undefined));
      }

      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

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

    const transactionLabel = await screen.findByText("Groceries");
    const transactionButton = transactionLabel.closest("button");
    if (!transactionButton) {
      throw new Error("Transaction button not found.");
    }

    fireEvent.click(transactionButton);
    fireEvent.click(screen.getByRole("button", { name: "Excluir transação" }));

    const modal = screen.getByRole("dialog", { name: "Excluir transação" });
    fireEvent.click(within(modal).getByRole("button", { name: "Excluir transação" }));

    await waitFor(() => {
      expect(
        vi.mocked(fetch).mock.calls.some(
          ([input, init]) =>
            String(input).endsWith("/api/transactions/tx-1?scope=SINGLE") &&
            init?.method === "DELETE",
        ),
      ).toBe(true);
    });
  });

  it("confirms grouped transaction deletion with FUTURE and ALL scopes", async () => {
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

    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input);

      if (url.includes("/api/transactions?") && (!init?.method || init.method === "GET")) {
        return Promise.resolve(
          jsonResponse({
            items: [groupedTransaction],
            page: 0,
            size: 12,
            totalItems: 1,
            totalPages: 1,
          }),
        );
      }

      if (url.includes("/api/accounts?")) {
        return Promise.resolve(
          jsonResponse({
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
          }),
        );
      }

      if (url.includes("/api/categories/options")) {
        return Promise.resolve(
          jsonResponse([
            {
              id: "cat-1",
              name: "Groceries",
              icon: "shopping-cart",
              color: "#2254d1",
            },
          ]),
        );
      }

      if (url.includes("/api/family-members")) {
        return Promise.resolve(
          jsonResponse({
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
          }),
        );
      }

      if (url.includes("/api/transactions/tx-1?") && init?.method === "DELETE") {
        return Promise.resolve(jsonResponse(undefined));
      }

      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

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

    const transactionLabel = await screen.findByText("Groceries");
    const transactionButton = transactionLabel.closest("button");
    if (!transactionButton) {
      throw new Error("Transaction button not found.");
    }

    fireEvent.click(transactionButton);
    fireEvent.click(screen.getByRole("button", { name: "Excluir transação" }));

    let modal = screen.getByRole("dialog", { name: "Excluir transação" });
    expect(within(modal).getByLabelText("Escopo da exclusão")).toBeInTheDocument();
    fireEvent.change(within(modal).getByLabelText("Escopo da exclusão"), {
      target: { value: "FUTURE" },
    });
    fireEvent.click(within(modal).getByRole("button", { name: "Excluir transação" }));

    await waitFor(() => {
      expect(
        vi.mocked(fetch).mock.calls.some(
          ([input, init]) =>
            String(input).endsWith("/api/transactions/tx-1?scope=FUTURE") &&
            init?.method === "DELETE",
        ),
      ).toBe(true);
    });

    fireEvent.click(transactionButton);
    fireEvent.click(screen.getByRole("button", { name: "Excluir transação" }));

    modal = screen.getByRole("dialog", { name: "Excluir transação" });
    fireEvent.change(within(modal).getByLabelText("Escopo da exclusão"), {
      target: { value: "ALL" },
    });
    fireEvent.click(within(modal).getByRole("button", { name: "Excluir transação" }));

    await waitFor(() => {
      expect(
        vi.mocked(fetch).mock.calls.some(
          ([input, init]) =>
            String(input).endsWith("/api/transactions/tx-1?scope=ALL") &&
            init?.method === "DELETE",
        ),
      ).toBe(true);
    });
  });

  it("shows projected fixed transactions without allowing edit from the transaction list", async () => {
    const futureReferenceMonth = shiftReferenceMonth(getCurrentReferenceMonth(), 1);

    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input);

      if (url.includes("/api/transactions?")) {
        return Promise.resolve(
          jsonResponse({
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
      }

      if (url.includes("/api/accounts?")) {
        return Promise.resolve(
          jsonResponse({
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
          }),
        );
      }

      if (url.includes("/api/categories/options")) {
        return Promise.resolve(
          jsonResponse([
            {
              id: "cat-1",
              name: "Groceries",
              icon: "shopping-cart",
              color: "#2254d1",
            },
          ]),
        );
      }

      if (url.includes("/api/family-members")) {
        return Promise.resolve(
          jsonResponse({
            items: [],
            page: 0,
            size: 200,
            totalItems: 0,
            totalPages: 0,
          }),
        );
      }

      return Promise.reject(new Error(`Unhandled request: ${url} ${init?.method ?? "GET"}`));
    });

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

    expect(await screen.findByText("Projected Rent")).toBeInTheDocument();
    expect(screen.getByText("Prevista")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Projected Rent/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Projected Rent"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lets the user move to previous and next months and highlights non-current months", async () => {
    const currentReferenceMonth = getCurrentReferenceMonth();
    const previousReferenceMonth = shiftReferenceMonth(currentReferenceMonth, -1);

    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input);
      const referenceMonth = url.includes("referenceMonth=")
        ? new URL(url).searchParams.get("referenceMonth")
        : null;

      if (url.includes("/api/transactions?")) {
        return Promise.resolve(
          jsonResponse({
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
          }),
        );
      }

      if (url.includes("/api/accounts?")) {
        return Promise.resolve(
          jsonResponse([
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
      }

      if (url.includes("/api/categories/options")) {
        return Promise.resolve(
          jsonResponse(
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
          ),
        );
      }

      if (url.includes("/api/family-members")) {
        return Promise.resolve(
          jsonResponse([
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
          ]),
        );
      }

      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

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

    expect(await screen.findByText("1-1 de 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Mês de referência", { selector: "input" }).parentElement).toHaveAttribute("data-current-month", "true");

    fireEvent.click(screen.getByRole("button", { name: "Mês anterior" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Mês de referência", { selector: "input" }).parentElement).toHaveAttribute("data-current-month", "false");
    });

    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(([input]) =>
          String(input).includes(`referenceMonth=${previousReferenceMonth}`),
        ),
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Próximo mês" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Mês de referência", { selector: "input" }).parentElement).toHaveAttribute("data-current-month", "true");
    });

    expect(
      vi
        .mocked(fetch)
        .mock.calls.filter(([input]) =>
          String(input).includes(`referenceMonth=${currentReferenceMonth}`),
        ).length,
    ).toBeGreaterThan(0);
  });

  it("derives the initial transaction date from the selected reference month when opening the creation form", async () => {
    const currentReferenceMonth = getCurrentReferenceMonth();
    const previousReferenceMonth = shiftReferenceMonth(currentReferenceMonth, -1);

    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input);
      const referenceMonth = url.includes("referenceMonth=")
        ? new URL(url).searchParams.get("referenceMonth")
        : null;

      if (url.includes("/api/transactions?")) {
        return Promise.resolve(
          jsonResponse({
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
          }),
        );
      }

      if (url.includes("/api/accounts?")) {
        return Promise.resolve(
          jsonResponse([
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
      }

      if (url.includes("/api/categories/options")) {
        return Promise.resolve(
          jsonResponse(
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
          ),
        );
      }

      if (url.includes("/api/family-members")) {
        return Promise.resolve(
          jsonResponse([
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
          ]),
        );
      }

      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

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

    expect(await screen.findByText("1-1 de 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mês anterior" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Mês de referência", { selector: "input" }).parentElement).toHaveAttribute("data-current-month", "false");
    });

    fireEvent.click(screen.getByRole("button", { name: "Nova transação" }));

    const drawer = screen.getByRole("dialog");
    const dateInput = within(drawer).getByLabelText("Data da transação");

    await waitFor(() => {
      expect(dateInput).toHaveValue(previousReferenceMonth);
    });
  });

  it("filters transactions by multiple categories without expanding the active chip list", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input);

      if (url.includes("/api/transactions?")) {
        return Promise.resolve(
          jsonResponse({
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
          }),
        );
      }

      if (url.includes("/api/accounts?")) {
        return Promise.resolve(
          jsonResponse([
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
      }

      if (url.includes("/api/categories/options")) {
        return Promise.resolve(
          jsonResponse([
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
          ]),
        );
      }

      if (url.includes("/api/family-members")) {
        return Promise.resolve(
          jsonResponse([
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
          ]),
        );
      }

      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

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

    expect(await screen.findByText("1-1 de 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    fireEvent.click(
      screen.getByLabelText("Categorias", { selector: "button" }),
    );

    const listbox = screen.getByRole("listbox");
    fireEvent.click(within(listbox).getByRole("option", { name: /Groceries/i }));
    fireEvent.click(within(listbox).getByRole("option", { name: /Transport/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Filtros/ }));

    await waitFor(() => {
      expect(screen.getByText("Categorias: Groceries, Transport")).toBeInTheDocument();
    });

    const transactionRequests = vi
      .mocked(fetch)
      .mock.calls.map(([input]) => String(input))
      .filter((url) => url.includes("/api/transactions?"));

    expect(
      transactionRequests.some(
        (url) =>
          url.includes("categoryIds=cat-1") &&
          url.includes("categoryIds=cat-2"),
      ),
    ).toBe(true);
  });
});
