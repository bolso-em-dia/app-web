import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import AppShell from "./AppShell";

describe("AppShell", () => {
  it("renders navigation items with library icons", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin User",
            email: "admin@my-money.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <AppShell title="Dashboard">
            <div>content</div>
          </AppShell>
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Navegação principal",
    });

    expect(within(navigation).getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Orçamentos" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Gastos fixos" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Transações" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Família" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Categorias" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Contas" })).toBeInTheDocument();
    expect(container.querySelectorAll("nav svg").length).toBe(7);
  });
});
