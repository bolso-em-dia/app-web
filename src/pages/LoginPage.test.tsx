import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TestAuthProvider } from "../app/auth/TestAuthProvider";
import LoginPage from "./LoginPage";

describe("LoginPage", () => {
  it("renders the login form", () => {
    render(
      <MemoryRouter>
        <TestAuthProvider>
          <LoginPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });
});
