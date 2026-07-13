import { act, fireEvent, screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { renderWithProviders } from "../test/fixtures";
import LoginPage from "./LoginPage";

describe("LoginPage", () => {
  it("renders the login form", () => {
    renderWithProviders(<LoginPage />, { user: null });

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toHaveValue("");
    expect(screen.getByLabelText("Senha")).toHaveValue("");
  });

  it("submits successfully and redirects to the home route", async () => {
    const login = vi.fn(async () => undefined);

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>,
      {
        route: "/login",
        user: null,
        authOverrides: { login },
      },
    );

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "admin@my-money.local" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "admin123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Home")).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith("admin@my-money.local", "admin123456");
  });

  it("shows a loading state while the login request is pending", async () => {
    let resolveLogin: (() => void) | undefined;
    const login = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLogin = resolve;
        }),
    );

    renderWithProviders(<LoginPage />, {
      user: null,
      authOverrides: { login },
    });

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "admin@my-money.local" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "admin123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByRole("button", { name: "Carregando..." }),
    ).toBeDisabled();

    await act(async () => {
      resolveLogin?.();
    });
  });

  it("shows an error message when authentication fails", async () => {
    const login = vi.fn(async () => {
      throw new Error("invalid credentials");
    });

    renderWithProviders(<LoginPage />, {
      user: null,
      authOverrides: { login },
    });

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "admin@my-money.local" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText(
        "Não foi possível entrar. Verifique o e-mail e a senha.",
      ),
    ).toBeInTheDocument();
  });
});
