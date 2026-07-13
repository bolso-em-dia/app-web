import { act, fireEvent, screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { renderWithProviders } from "../test/fixtures";
import { t } from "../test/i18n";
import LoginPage from "./LoginPage";

describe("LoginPage", () => {
  it("renders the login form", () => {
    renderWithProviders(<LoginPage />, { user: null });

    expect(screen.getByRole("heading", { name: t("login.title") })).toBeInTheDocument();
    expect(screen.getByLabelText(t("common.email"))).toHaveValue("");
    expect(screen.getByLabelText(t("family.password"))).toHaveValue("");
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

    fireEvent.change(screen.getByLabelText(t("common.email")), {
      target: { value: "admin@my-money.local" },
    });
    fireEvent.change(screen.getByLabelText(t("family.password")), {
      target: { value: "admin123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: t("login.submit") }));

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

    fireEvent.change(screen.getByLabelText(t("common.email")), {
      target: { value: "admin@my-money.local" },
    });
    fireEvent.change(screen.getByLabelText(t("family.password")), {
      target: { value: "admin123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: t("login.submit") }));

    expect(await screen.findByRole("button", { name: t("common.loading") })).toBeDisabled();

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

    fireEvent.change(screen.getByLabelText(t("common.email")), {
      target: { value: "admin@my-money.local" },
    });
    fireEvent.change(screen.getByLabelText(t("family.password")), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: t("login.submit") }));

    expect(await screen.findByText(t("login.error"))).toBeInTheDocument();
  });
});
