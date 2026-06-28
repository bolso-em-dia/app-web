import { render, screen } from "@testing-library/react";
import HomePage from "./HomePage";
import { TestAuthProvider } from "../app/auth/AuthContext";

describe("HomePage", () => {
  it("renders the home skeleton", () => {
    render(
      <TestAuthProvider
        user={{
          id: "1",
          name: "Admin",
          email: "admin@my-money.local",
          role: "ADMIN",
          allowanceEnabled: false
        }}
      >
        <HomePage />
      </TestAuthProvider>
    );

    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();
  });
});
