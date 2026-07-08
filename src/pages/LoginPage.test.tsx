import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TestAuthProvider } from "../app/auth/TestAuthProvider";
import LoginPage from "./LoginPage";

describe("LoginPage", () => {
  it("renders the login form", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TestAuthProvider>
          <LoginPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
  });
});
