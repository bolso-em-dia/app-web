import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import AppShell from "./AppShell";

describe("AppShell", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
      writable: true,
    });
    window.dispatchEvent(new Event("resize"));
  });

  it("renders navigation items with library icons", () => {
    const { container } = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin User",
            email: "admin@bolso-em-dia.local",
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

    expect(screen.getByRole("link", { name: "Configurações" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Orçamentos" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Transações fixas" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Transações" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Família" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Categorias" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Contas" })).toBeInTheDocument();
    expect(container.querySelectorAll("nav svg").length).toBe(7);
    expect(screen.queryByText("admin@bolso-em-dia.local")).not.toBeInTheDocument();
  });

  it("renders the navigation inside a drawer on compact screens", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 480,
      writable: true,
    });
    window.dispatchEvent(new Event("resize"));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin User",
            email: "admin@bolso-em-dia.local",
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

    expect(screen.queryByRole("navigation", { name: "Navegação principal" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Navegação principal" }));

    const dialog = screen.getByRole("dialog");
    const navigation = within(dialog).getByRole("navigation", {
      name: "Navegação principal",
    });

    expect(within(dialog).getByRole("link", { name: "Configurações" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(within(dialog).getByText("Admin User")).toBeInTheDocument();
    expect(within(dialog).getByText("Administrador")).toBeInTheDocument();
    expect(within(dialog).queryByText("admin@bolso-em-dia.local")).not.toBeInTheDocument();
  });
});
