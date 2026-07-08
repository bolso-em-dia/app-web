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
import BudgetsPage from "./BudgetsPage";

describe("BudgetsPage", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
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
        }),
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
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
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
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
        text: async () => "",
      } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads budgets and validates budget-specific fields", async () => {
    render(
      <MemoryRouter initialEntries={["/budgets"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@my-money.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <BudgetsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Household")).toBeInTheDocument();
    expect(screen.getByText("1-1 de 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Novo orçamento" }));
    const drawer = screen.getByRole("dialog");

    fireEvent.change(within(drawer).getByLabelText("Nome"), {
      target: { value: "Allowance budget" },
    });
    fireEvent.change(within(drawer).getByLabelText("Limite mensal"), {
      target: { value: "450" },
    });
    fireEvent.change(within(drawer).getByLabelText("Tipo"), {
      target: { value: "ALLOWANCE" },
    });

    fireEvent.click(
      within(drawer).getByRole("button", { name: "Criar orçamento" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "O membro dono é obrigatório para budgets de mesada.",
        ),
      ).toBeInTheDocument();
    });
  });
  it("lets the user move to previous and next months and highlights non-current months", async () => {
    const currentReferenceMonth = getCurrentReferenceMonth();
    const previousReferenceMonth = shiftReferenceMonth(currentReferenceMonth, -1);

    render(
      <MemoryRouter initialEntries={["/budgets"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@my-money.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <BudgetsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Household")).toBeInTheDocument();
    expect(screen.getByText("Mês atual")).toBeInTheDocument();

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
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [], text: async () => "" } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [], page: 0, size: 200, totalItems: 0, totalPages: 0 }),
        text: async () => "",
      } as Response);

    fireEvent.click(screen.getByRole("button", { name: "Mês anterior" }));

    await waitFor(() => {
      expect(screen.getByText("Fora do mês atual")).toBeInTheDocument();
    });

    const previousMonthCall = vi
      .mocked(fetch)
      .mock.calls.find(([input]) =>
        String(input).includes(`referenceMonth=${previousReferenceMonth}`),
      );
    expect(previousMonthCall).toBeTruthy();

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
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
              createdInMonth: currentReferenceMonth,
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
        }),
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "cat-1",
            name: "Groceries",
            icon: "shopping-cart",
            color: "#2254d1",
          },
        ],
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [], page: 0, size: 200, totalItems: 0, totalPages: 0 }),
        text: async () => "",
      } as Response);

    fireEvent.click(screen.getByRole("button", { name: "Próximo mês" }));

    await waitFor(() => {
      expect(screen.getByText("Mês atual")).toBeInTheDocument();
    });

    const currentMonthCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([input]) =>
        String(input).includes(`referenceMonth=${currentReferenceMonth}`),
      );
    expect(currentMonthCalls.length).toBeGreaterThan(0);
  });

});
