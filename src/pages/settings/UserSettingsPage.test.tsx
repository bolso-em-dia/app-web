import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import { t } from "../../test/i18n";
import { resetFetchMocks, mockJsonResponse, mockErrorResponse, mockFetchUrl } from "../../test/setup";
import UserSettingsPage from "./UserSettingsPage";

describe("UserSettingsPage", () => {
  let savedPayload: Record<string, unknown> | null;

  beforeEach(() => {
    savedPayload = null;
    resetFetchMocks();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
      writable: true,
    });
    window.dispatchEvent(new Event("resize"));

    // Configure GET mocks first
    mockFetchUrl(
      "/api/accounts/options",
      mockJsonResponse([
        {
          id: "acc-1",
          name: "Main Checking",
          type: "CHECKING",
        },
      ]),
    );

    // Configure GET for /api/me/preferences
    mockFetchUrl("/api/me/preferences", (input, init) => {
      if (init?.method === "PUT") {
        savedPayload = JSON.parse(String(init.body ?? "{}")) as Record<string, unknown>;
        return mockJsonResponse({
          defaultAccountId: "acc-1",
          locale: "en-US",
          showBalanceWithBudgets: true,
          showForeignCurrency: false,
        });
      }
      // Handle GET request for initial load
      return mockJsonResponse({
        defaultAccountId: null,
        locale: "pt-BR",
        showBalanceWithBudgets: false,
        showForeignCurrency: false,
      });
    });

    mockFetchUrl("/api/auth/change-password", (input, init) => {
      if (init?.method === "POST") {
        return mockJsonResponse({
          id: "1",
          name: "Admin",
          email: "admin@bolso-em-dia.local",
          role: "ADMIN",
          allowanceEnabled: false,
          mustChangePassword: false,
          preferences: {
            defaultAccountId: "acc-1",
            locale: "en-US",
            showBalanceWithBudgets: true,
            showForeignCurrency: false,
          },
        });
      }
      return mockErrorResponse(404);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("saves null as the default account when no account is selected", async () => {
    resetFetchMocks();
    savedPayload = null;

    mockFetchUrl("/api/accounts/options", mockJsonResponse([]));

    mockFetchUrl("/api/me/preferences", (input, init) => {
      if (init?.method === "PUT") {
        savedPayload = JSON.parse(String(init.body ?? "{}")) as Record<string, unknown>;
        return mockJsonResponse({
          defaultAccountId: null,
          locale: "pt-BR",
          showBalanceWithBudgets: false,
        });
      }
      // Handle GET request for initial load
      return mockJsonResponse({
        defaultAccountId: null,
        locale: "pt-BR",
        showBalanceWithBudgets: false,
      });
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/settings"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <UserSettingsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(t("settings.formTitle"))).toBeInTheDocument();
    fireEvent.click(within(screen.getByText(t("settings.formTitle")).closest("form")!).getByRole("button", { name: t("common.save") }));

    expect(await screen.findByText(t("settings.saveSuccess"))).toBeInTheDocument();
    expect(savedPayload).toEqual({
      defaultAccountId: null,
      locale: "pt-BR",
      showBalanceWithBudgets: false,
      showForeignCurrency: false,
    });
  });

  it("shows an error message when saving the preferences fails", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/accounts/options",
      mockJsonResponse([
        {
          id: "acc-1",
          name: "Main Checking",
          type: "CHECKING",
        },
      ]),
    );

    mockFetchUrl("/api/me/preferences", (input, init) => {
      if (init?.method === "PUT") {
        return mockErrorResponse(
          422,
          JSON.stringify({
            status: 422,
            code: 42218,
            error: "Unprocessable Entity",
            message: "Locale is not supported.",
          }),
        );
      }
      // Handle GET request for initial load
      return mockJsonResponse({
        defaultAccountId: null,
        locale: "pt-BR",
        showBalanceWithBudgets: false,
      });
    });

    mockFetchUrl("/api/auth/change-password", (input, init) => {
      if (init?.method === "POST") {
        return () => Promise.reject(new Error("password failed"));
      }
      return mockErrorResponse(404);
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/settings"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <UserSettingsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(t("settings.formTitle"))).toBeInTheDocument();
    fireEvent.click(within(screen.getByText(t("settings.formTitle")).closest("form")!).getByRole("button", { name: t("common.save") }));

    expect(await screen.findByText(t("error.unsupportedLocale"))).toBeInTheDocument();
  });

  it("renders the direct form and saves the preferences", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/settings"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <UserSettingsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: t("settings.title") })).toBeInTheDocument();
    expect(await screen.findByText(t("settings.formTitle"))).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    const prefsForm = screen.getByText(t("settings.formTitle")).closest("form")!;
    fireEvent.change(screen.getByRole("combobox", { name: t("settings.account.label") }), {
      target: { value: "acc-1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: t("settings.locale.label") }), {
      target: { value: "en-US" },
    });
    fireEvent.click(screen.getByRole("switch", { name: t("settings.balance.withBudgets") }));
    fireEvent.click(within(prefsForm).getByRole("button", { name: t("common.save") }));

    expect(await screen.findByText(t("settings.saveSuccess"))).toBeInTheDocument();
    expect(savedPayload).toEqual({
      defaultAccountId: "acc-1",
      locale: "en-US",
      showBalanceWithBudgets: true,
      showForeignCurrency: false,
    });
  });

  it("saves the foreign currency preference when enabling it", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/settings"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <UserSettingsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const prefsForm = (await screen.findByText(t("settings.formTitle"))).closest("form")!;
    fireEvent.click(screen.getByRole("switch", { name: t("settings.foreignCurrency.disabled") }));
    fireEvent.click(within(prefsForm).getByRole("button", { name: t("common.save") }));

    expect(await screen.findByText(t("settings.saveSuccess"))).toBeInTheDocument();
    expect(savedPayload).toEqual({
      defaultAccountId: null,
      locale: "pt-BR",
      showBalanceWithBudgets: false,
      showForeignCurrency: true,
    });
  });

  it("saves the foreign currency preference when disabling it", async () => {
    resetFetchMocks();
    savedPayload = null;

    mockFetchUrl(
      "/api/accounts/options",
      mockJsonResponse([
        {
          id: "acc-1",
          name: "Main Checking",
          type: "CHECKING",
        },
      ]),
    );

    mockFetchUrl("/api/me/preferences", (input, init) => {
      if (init?.method === "PUT") {
        savedPayload = JSON.parse(String(init.body ?? "{}")) as Record<string, unknown>;
        return mockJsonResponse({
          defaultAccountId: null,
          locale: "pt-BR",
          showBalanceWithBudgets: false,
          showForeignCurrency: false,
        });
      }

      return mockJsonResponse({
        defaultAccountId: null,
        locale: "pt-BR",
        showBalanceWithBudgets: false,
        showForeignCurrency: true,
      });
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/settings"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
            preferences: {
              defaultAccountId: null,
              locale: "pt-BR",
              showBalanceWithBudgets: false,
              showForeignCurrency: true,
            },
          }}
        >
          <UserSettingsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const prefsForm = (await screen.findByText(t("settings.formTitle"))).closest("form")!;
    fireEvent.click(screen.getByRole("switch", { name: t("settings.foreignCurrency.enabled") }));
    fireEvent.click(within(prefsForm).getByRole("button", { name: t("common.save") }));

    expect(await screen.findByText(t("settings.saveSuccess"))).toBeInTheDocument();
    expect(savedPayload).toEqual({
      defaultAccountId: null,
      locale: "pt-BR",
      showBalanceWithBudgets: false,
      showForeignCurrency: false,
    });
  });

  it("changes the current user password from settings", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/settings"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <UserSettingsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(t("settings.formTitle"))).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(t("settings.password.current")), {
      target: { value: "admin12345678" },
    });
    fireEvent.change(screen.getByLabelText(t("settings.password.new")), {
      target: { value: "novaSenha123" },
    });
    fireEvent.change(screen.getByLabelText(t("settings.password.confirm")), {
      target: { value: "novaSenha123" },
    });
    fireEvent.click(
      within(screen.getByRole("heading", { name: t("settings.password.title") }).closest("form")!).getByRole("button", {
        name: t("common.save"),
      }),
    );

    expect(await screen.findByText(t("settings.password.success"))).toBeInTheDocument();
  });

  it("shows session expired feedback for preferences and keeps the chosen value", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/settings"]}>
        <TestAuthProvider
          authOverrides={{ accessToken: null }}
          user={{ id: "1", name: "Admin", email: "admin@bolso-em-dia.local", role: "ADMIN" }}
        >
          <UserSettingsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(t("common.sessionExpired"))).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: t("settings.locale.label") }), {
      target: { value: "en-US" },
    });
    fireEvent.click(within(screen.getByText(t("settings.formTitle")).closest("form")!).getByRole("button", { name: t("common.save") }));

    expect(await screen.findAllByText(t("common.sessionExpired"))).not.toHaveLength(0);
    expect(screen.getByRole("combobox", { name: t("settings.locale.label") })).toHaveValue("en-US");
  });
});
