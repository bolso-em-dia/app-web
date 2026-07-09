import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { TestAuthProvider } from "./app/auth/TestAuthProvider";

describe("App", () => {
  it("redirects flagged users to the mandatory password change page", async () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={["/dashboard"]}
      >
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
            mustChangePassword: true,
          }}
        >
          <App />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Defina uma nova senha" }),
    ).toBeInTheDocument();
  });
});
