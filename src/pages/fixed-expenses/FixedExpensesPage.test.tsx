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
import { resetFetchMocks, mockJsonResponse, mockErrorResponse, mockFetchUrl } from "../../test/setup";
import FixedExpensesPage from "./FixedExpensesPage";

const defaultTemplatesResponse = {
  items: [
    {
      id: "template-1",
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
}

describe("FixedExpensesPage", () => {
  beforeEach(() => {
    resetFetchMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads templates and validates required form fields", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/fixed-transactions"]}>
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
    expect(
      screen.getByText("Housing · Main checking · Vence dia 05"),
    ).toBeInTheDocument();
    expect(screen.getByText("1-1 de 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nova transação fixa" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Water bill" },
    });
    fireEvent.change(screen.getByLabelText("Tipo"), {
      target: { value: "INCOME" },
    });
    fireEvent.change(screen.getByLabelText("Valor"), {
      target: { value: "150" },
    });
    expect(screen.getByLabelText("Dia do recebimento")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Dia do recebimento"), {
      target: { value: "12" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Criar transação fixa" }));

    await waitFor(() => {
      expect(
        screen.getByText("A categoria é obrigatória."),
      ).toBeInTheDocument();
      expect(screen.getByText("A conta é obrigatória.")).toBeInTheDocument();
    });
  });

  it("renders templates as full-width single-column list", async () => {
    resetFetchMocks();

    mockFetchUrl("/api/fixed-transactions?", mockJsonResponse({
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
    }));
    // Use fallback for remaining calls
    mockFetchUrl("/api/categories", mockJsonResponse([]));
    mockFetchUrl("/api/accounts", mockJsonResponse([]));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/fixed-transactions"]}>
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
    expect(screen.getByText("1-2 de 2")).toBeInTheDocument();
  });

  it("shows range text when no templates exist", async () => {
    resetFetchMocks();

    mockFetchUrl("/api/fixed-transactions?", mockJsonResponse({
      items: [],
      page: 0,
      size: 12,
      totalItems: 0,
      totalPages: 0,
    }));
    mockFetchUrl("/api/categories", mockJsonResponse([]));
    mockFetchUrl("/api/accounts", mockJsonResponse([]));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/fixed-transactions"]}>
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

    expect(
      await screen.findByText("Nenhuma transação fixa encontrada para os filtros atuais."),
    ).toBeInTheDocument();
  });

  it("opens delete confirmation alertdialog when the delete button is clicked", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/fixed-transactions"]}>
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
      name: "Excluir",
    });
    fireEvent.click(deleteButton);

    const alertDialog = screen.getByRole("alertdialog");
    expect(alertDialog).toBeInTheDocument();
    expect(
      within(alertDialog).getByText(
        "Tem certeza que deseja excluir esta transação fixa? As transações materializadas do mês corrente em diante serão removidas. Transações de meses passados serão preservadas.",
      ),
    ).toBeInTheDocument();
  });

  it("cancels delete confirmation without calling the API", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/fixed-transactions"]}>
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
      name: "Excluir",
    });
    fireEvent.click(deleteButton);

    const alertDialog = screen.getByRole("alertdialog");
    expect(alertDialog).toBeInTheDocument();

    fireEvent.click(within(alertDialog).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    const deleteCalls = vi.mocked(fetch).mock.calls.filter(
      ([input, init]) =>
        String(input).includes("/api/fixed-transactions/") &&
        init?.method === "DELETE",
    );
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
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/fixed-transactions"]}>
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
      name: "Excluir",
    });
    fireEvent.click(deleteButton);

    const alertDialog = screen.getByRole("alertdialog");
    const confirmButton = within(alertDialog).getByRole("button", {
      name: "Excluir",
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.getByText("Não foi possível excluir a transação fixa."),
      ).toBeInTheDocument();
    });
  });
});
