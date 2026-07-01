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
      <MemoryRouter initialEntries={["/fixed-expenses"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@my-money.local",
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

    fireEvent.click(screen.getByRole("button", { name: "Novo gasto fixo" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Water bill" },
    });
    fireEvent.change(screen.getByLabelText("Valor"), {
      target: { value: "150" },
    });
    fireEvent.change(screen.getByLabelText("Dia de vencimento"), {
      target: { value: "12" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Criar gasto fixo" }));

    await waitFor(() => {
      expect(
        screen.getByText("A categoria é obrigatória."),
      ).toBeInTheDocument();
      expect(screen.getByText("A conta é obrigatória.")).toBeInTheDocument();
    });
  });
});
