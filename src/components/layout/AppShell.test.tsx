import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

    expect(screen.queryByRole("navigation", { name: t("navigation.aria") })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("navigation.aria") }));

    const dialog = screen.getByRole("dialog");
    const navigation = within(dialog).getByRole("navigation", {
      name: t("navigation.aria"),
    });

    expect(within(dialog).getByRole("link", { name: t("settings.title") })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: t("navigation.dashboard") })).toBeInTheDocument();
    expect(within(dialog).getByText("Admin User")).toBeInTheDocument();
    expect(within(dialog).getByText(t("roles.ADMIN"))).toBeInTheDocument();
    expect(within(dialog).queryByText("admin@bolso-em-dia.local")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(within(dialog).getByRole("button", { name: t("common.closeDrawer") }));

    expect(document.body.style.overflow).toBe("");
  });
});
