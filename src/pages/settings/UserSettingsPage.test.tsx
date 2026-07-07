import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import UserSettingsPage from "./UserSettingsPage";

describe("UserSettingsPage", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
      writable: true,
    });
    window.dispatchEvent(new Event("resize"));

    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input);

      if (url.includes("/api/accounts/options")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            {
              id: "acc-1",
              name: "Main Checking",
              type: "CHECKING",
            },
          ],
          text: async () => "",
        } as Response);
      }

      if (url.endsWith("/api/me/preferences") && init?.method === "PUT") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            defaultAccountId: "acc-1",
            locale: "en-US",
            showBalanceWithBudgets: true,
          }),
          text: async () => "",
        } as Response);
      }

      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the direct form and saves the preferences", async () => {
    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@my-money.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <UserSettingsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Configurações" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Preferências pessoais")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Conta padrão" }), {
      target: { value: "acc-1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Idioma" }), {
      target: { value: "en-US" },
    });
    fireEvent.click(
      screen.getByRole("switch", { name: "Considera orçamentos" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar preferências" }),
    );

    expect(await screen.findByText("Configurações salvas.")).toBeInTheDocument();
  });
});
