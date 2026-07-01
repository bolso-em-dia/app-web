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
      ]),
    )
    .mockResolvedValueOnce(
      jsonResponse({
        items: [
          {
            id: "member-1",
            name: "Taylor",
            email: "taylor@my-money.local",
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

describe("TransactionsPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads transactions and validates member selection for individual ownership", async () => {
    queueInitialLoads();

    render(
      <MemoryRouter initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@my-money.local",
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
    fireEvent.change(
      within(drawer).getByLabelText("Categoria", {
        selector: "#transaction-category",
      }),
      {
        target: { value: "cat-1" },
      },
    );
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
            amount: 90,
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
      <MemoryRouter initialEntries={["/transactions"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@my-money.local",
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
    fireEvent.change(
      within(drawer).getByLabelText("Categoria", {
        selector: "#transaction-category",
      }),
      {
        target: { value: "cat-1" },
      },
    );

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
      within(drawer).getByLabelText("Categoria", {
        selector: "#transaction-category",
      }),
    ).toHaveValue("cat-1");
  });
});
