import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "./HomePage";
import { TestAuthProvider } from "../app/auth/TestAuthProvider";

describe("HomePage", () => {
  it("renders the home skeleton", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@my-money.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <HomePage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Family")).toBeInTheDocument();
  });
});
