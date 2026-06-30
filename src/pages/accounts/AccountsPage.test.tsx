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
import AccountsPage from "./AccountsPage";

describe("AccountsPage", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
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
        size: 12,
        totalItems: 1,
        totalPages: 1,
      }),
      text: async () => "",
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads accounts and validates credit card fields", async () => {
    render(
      <MemoryRouter initialEntries={["/accounts"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@my-money.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <AccountsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Main checking")).toBeInTheDocument();
    expect(screen.getByText("1-1 de 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nova conta" }));
    const drawer = screen.getByRole("dialog");
    expect(drawer).toBeInTheDocument();

    fireEvent.change(within(drawer).getByLabelText("Tipo"), {
      target: { value: "CREDIT_CARD" },
    });

    fireEvent.click(
      within(drawer).getByRole("button", { name: "Criar conta" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("A bandeira é obrigatória para cartões de crédito."),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "O dia de fechamento é obrigatório para cartões de crédito.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "O dia de vencimento é obrigatório para cartões de crédito.",
        ),
      ).toBeInTheDocument();
    });
  });
});
