import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import { t } from "../../test/i18n";
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
      name: t("navigation.aria"),
    });

    expect(screen.getByRole("link", { name: t("settings.title") })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: t("navigation.dashboard") })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: t("navigation.budgets") })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: t("navigation.fixedTransactions") })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: t("navigation.transactions") })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: t("navigation.family") })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: t("navigation.categories") })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: t("navigation.accounts") })).toBeInTheDocument();
    expect(within(navigation).getAllByRole("link")[0]).toHaveAccessibleName(t("navigation.transactions"));
    expect(container.querySelectorAll("nav svg").length).toBe(7);
    expect(container.querySelector('[class*="navSectionSpacer"]')).toBeNull();
    expect(screen.queryByText("admin@bolso-em-dia.local")).not.toBeInTheDocument();
  });

  it("renders the navigation from the bottom action bar on compact screens", () => {
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

    expect(screen.queryByRole("navigation", { name: t("navigation.aria") })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("common.menu") }));

    const dialog = screen.getByRole("dialog");
    const navigation = within(dialog).getByRole("navigation", {
      name: t("navigation.aria"),
    });

    expect(within(dialog).getByRole("link", { name: t("settings.title") })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: t("navigation.dashboard") })).toBeInTheDocument();
    expect(within(dialog).getByText("Admin User")).toBeInTheDocument();
    expect(within(dialog).getByText(t("roles.ADMIN"))).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: t("common.close") })).toBeInTheDocument();
    expect(within(dialog).queryByText("admin@bolso-em-dia.local")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    expect(within(dialog).queryByRole("button", { name: t("common.closeDrawer") })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: t("common.close") }));

    expect(document.body.style.overflow).toBe("");
  });

  it("renders a bottom action bar on mobile CRUD screens and hides header menu/actions", () => {
    const onCreate = vi.fn();
    const onSearch = vi.fn();

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 480,
      writable: true,
    });
    window.dispatchEvent(new Event("resize"));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
        <TestAuthProvider user={{ id: "1", name: "Admin User", email: "admin@bolso-em-dia.local", role: "ADMIN", allowanceEnabled: false }}>
          <AppShell
            title="Dashboard"
            actions={<button type="button">Novo header</button>}
            mobileActions={{ createLabel: "Novo", onCreate, onSearch }}
          >
            <div>content</div>
          </AppShell>
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: t("navigation.aria") })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: t("common.menu") })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Novo header" })).not.toBeInTheDocument();
    expect(screen.getByLabelText(t("navigation.dashboard"))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Novo" }));
    fireEvent.click(screen.getByRole("button", { name: t("common.search") }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: t("common.menu") }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders only the menu action in the bottom bar on mobile screens without create action", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 480,
      writable: true,
    });
    window.dispatchEvent(new Event("resize"));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
        <TestAuthProvider user={{ id: "1", name: "Admin User", email: "admin@bolso-em-dia.local", role: "ADMIN", allowanceEnabled: false }}>
          <AppShell title="Dashboard">
            <div>content</div>
          </AppShell>
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: t("navigation.aria") })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("common.menu") })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: t("common.search") })).not.toBeInTheDocument();
    expect(screen.getByLabelText(t("navigation.dashboard"))).toBeInTheDocument();
  });

  it("hides the mobile action bar while a CRUD drawer is open", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 480,
      writable: true,
    });
    window.dispatchEvent(new Event("resize"));

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}>
        <TestAuthProvider user={{ id: "1", name: "Admin User", email: "admin@bolso-em-dia.local", role: "ADMIN", allowanceEnabled: false }}>
          <AppShell title="Dashboard" mobileActionBarHidden mobileActions={{ createLabel: "Novo", onCreate: vi.fn(), onSearch: vi.fn() }}>
            <div>content</div>
          </AppShell>
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: t("common.menu") })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: t("common.search") })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: t("navigation.aria") })).not.toBeInTheDocument();
    expect(screen.getByLabelText(t("navigation.dashboard"))).toBeInTheDocument();
  });
});
