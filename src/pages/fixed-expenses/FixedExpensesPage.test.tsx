import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import FixedExpensesPage from "./FixedExpensesPage";

describe("FixedExpensesPage", () => {
  beforeEach(() => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
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
        }),
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "cat-1",
            name: "Housing",
            icon: "home",
            color: "#2254d1",
          },
        ],
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "account-1",
            name: "Main checking",
            type: "CHECKING",
          },
        ],
        text: async () => "",
      } as Response);
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
    vi.mocked(fetch).mockReset();
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
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
        text: async () => "",
      } as Response)
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
        text: async () => "",
      } as Response);

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
    vi.mocked(fetch).mockReset();
    vi.mocked(fetch)
      .mockResolvedValueOnce({
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
      } as Response)
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
        text: async () => "",
      } as Response);

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
});
