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
    vi.mocked(fetch).mockResolvedValue({
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
            email: "admin@bolso-em-dia.local",
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

  it("keeps the search field focused during filtering and uses the configured card color visually", async () => {
    render(
      <MemoryRouter initialEntries={["/accounts"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <AccountsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Main checking")).toBeInTheDocument();

    const searchInput = screen.getByRole("textbox", { name: "Buscar" });
    searchInput.focus();

    fireEvent.change(searchInput, { target: { value: "Main" } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    expect(searchInput).toHaveFocus();
    expect(screen.queryByText("#2254d1")).not.toBeInTheDocument();
    const accountButton = screen.getByRole("button", { name: /Main checking/ });
    const accountSwatch = accountButton.querySelector('span[style]');

    expect(accountSwatch).not.toBeNull();
    expect(accountSwatch).toHaveStyle({ backgroundColor: "rgb(34, 84, 209)" });
  });
  it("preserves active filters after update and refetches the list with the same query", async () => {
    vi.mocked(fetch).mockImplementation((_input, init) => {
      const method = init?.method ?? "GET";

      if (method === "PUT") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
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
          }),
          text: async () => "",
        } as Response);
      }

      return Promise.resolve({
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

    render(
      <MemoryRouter initialEntries={["/accounts"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <AccountsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    await screen.findByText("Main checking");

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar" }), {
      target: { value: "Main" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filtros (1)" }));
    fireEvent.change(
      screen.getByLabelText("Tipo", { selector: "#account-type-filter" }),
      {
        target: { value: "CHECKING" },
      },
    );

    fireEvent.click(screen.getByRole("button", { name: /Main checking/ }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Buscar" })).toHaveValue(
        "Main",
      );
    });

    if (!screen.queryByLabelText("Tipo", { selector: "#account-type-filter" })) {
      fireEvent.click(screen.getByRole("button", { name: "Filtros (2)" }));
    }

    expect(
      screen.getByLabelText("Tipo", { selector: "#account-type-filter" }),
    ).toHaveValue("CHECKING");

    const accountRequests = vi
      .mocked(fetch)
      .mock.calls.map(([input]) => String(input))
      .filter((url) => url.includes("/api/accounts?") && !url.includes("options"));

    expect(accountRequests.some((url) => url.includes("search=Main"))).toBe(
      true,
    );
    expect(accountRequests.some((url) => url.includes("type=CHECKING"))).toBe(
      true,
    );
  });

});
