import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import { t } from "../../test/i18n";
import { resetFetchMocks, mockJsonResponse, mockErrorResponse, mockFetchUrl } from "../../test/setup";
import FamilyPage from "./FamilyPage";

const defaultMemberResponse = {
  items: [
    {
      id: "member-1",
      name: "Admin",
      email: "admin@bolso-em-dia.local",
      role: "ADMIN",
      active: true,
      allowanceEnabled: false,
      createdAt: "2026-06-01T10:00:00Z",
      updatedAt: "2026-06-01T10:00:00Z",
    },
  ],
  page: 0,
  size: 12,
  totalItems: 1,
  totalPages: 1,
};

function setupDefaultMocks() {
  mockFetchUrl("/api/family-members?", mockJsonResponse(defaultMemberResponse));
}

describe("FamilyPage", () => {
  beforeEach(() => {
    resetFetchMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens "Arquivar" confirmation for an active member', async () => {
    setupDefaultMocks();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/family"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FamilyPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Admin")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Admin/ }));

    const archiveButton = await screen.findByRole("button", {
      name: t("common.archive"),
    });
    fireEvent.click(archiveButton);

    const alertDialog = screen.getByRole("alertdialog");
    expect(alertDialog).toBeInTheDocument();
    expect(within(alertDialog).getByText(t("confirmations.archiveMember"))).toBeInTheDocument();
  });

  it("cancels archive confirmation without calling the API", async () => {
    setupDefaultMocks();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/family"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FamilyPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Admin")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Admin/ }));

    const archiveButton = await screen.findByRole("button", {
      name: t("common.archive"),
    });
    fireEvent.click(archiveButton);

    const alertDialog = screen.getByRole("alertdialog");
    expect(alertDialog).toBeInTheDocument();

    fireEvent.click(within(alertDialog).getByRole("button", { name: t("common.cancel") }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    const archiveCalls = vi
      .mocked(fetch)
      .mock.calls.filter(
        ([input, init]) => String(input).includes("/api/family-members/") && String(input).includes("/archive") && init?.method === "PATCH",
      );
    expect(archiveCalls.length).toBe(0);
  });

  it('opens "Reativar membro" confirmation for an inactive member', async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/family-members?",
      mockJsonResponse({
        items: [
          {
            id: "member-2",
            name: "Jane",
            email: "jane@bolso-em-dia.local",
            role: "USER",
            active: false,
            allowanceEnabled: false,
            createdAt: "2026-06-01T10:00:00Z",
            updatedAt: "2026-07-01T10:00:00Z",
          },
        ],
        page: 0,
        size: 12,
        totalItems: 1,
        totalPages: 1,
      }),
    );

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/family"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FamilyPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Jane")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Jane/ }));

    const restoreButton = await screen.findByRole("button", {
      name: t("family.restoreMember"),
    });
    fireEvent.click(restoreButton);

    const alertDialog = screen.getByRole("alertdialog");
    expect(alertDialog).toBeInTheDocument();
    expect(within(alertDialog).getByText(t("confirmations.restoreMember"))).toBeInTheDocument();
  });

  it("cancels restore confirmation without calling the API", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/family-members?",
      mockJsonResponse({
        items: [
          {
            id: "member-2",
            name: "Jane",
            email: "jane@bolso-em-dia.local",
            role: "USER",
            active: false,
            allowanceEnabled: false,
            createdAt: "2026-06-01T10:00:00Z",
            updatedAt: "2026-07-01T10:00:00Z",
          },
        ],
        page: 0,
        size: 12,
        totalItems: 1,
        totalPages: 1,
      }),
    );

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/family"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FamilyPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Jane")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Jane/ }));

    const restoreButton = await screen.findByRole("button", {
      name: t("family.restoreMember"),
    });
    fireEvent.click(restoreButton);

    const alertDialog = screen.getByRole("alertdialog");
    expect(alertDialog).toBeInTheDocument();

    fireEvent.click(within(alertDialog).getByRole("button", { name: t("common.cancel") }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    const restoreCalls = vi
      .mocked(fetch)
      .mock.calls.filter(
        ([input, init]) => String(input).includes("/api/family-members/") && String(input).includes("/restore") && init?.method === "PATCH",
      );
    expect(restoreCalls.length).toBe(0);
  });

  it("confirms archive and calls PATCH /api/family-members/{id}/archive", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/family-members?",
      mockJsonResponse({
        items: [
          {
            id: "member-3",
            name: "Alice",
            email: "alice@bolso-em-dia.local",
            role: "USER",
            active: true,
            allowanceEnabled: false,
            createdAt: "2026-06-01T10:00:00Z",
            updatedAt: "2026-06-01T10:00:00Z",
          },
        ],
        page: 0,
        size: 12,
        totalItems: 1,
        totalPages: 1,
      }),
    );

    mockFetchUrl("/api/family-members/member-3/archive", (input, init) => {
      if (init?.method === "PATCH") {
        return mockJsonResponse({
          id: "member-3",
          name: "Alice",
          email: "alice@bolso-em-dia.local",
          role: "USER",
          active: false,
          allowanceEnabled: false,
          createdAt: "2026-06-01T10:00:00Z",
          updatedAt: "2026-07-09T10:00:00Z",
        });
      }
      return mockErrorResponse(404);
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/family"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FamilyPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Alice")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Alice/ }));

    const archiveButton = await screen.findByRole("button", {
      name: t("common.archive"),
    });
    fireEvent.click(archiveButton);

    const alertDialog = screen.getByRole("alertdialog");
    fireEvent.click(within(alertDialog).getByRole("button", { name: t("common.archive") }));

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining("/api/family-members/member-3/archive"),
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("shows error feedback when archive fails", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/family-members?",
      mockJsonResponse({
        items: [
          {
            id: "member-4",
            name: "Bob",
            email: "bob@bolso-em-dia.local",
            role: "USER",
            active: true,
            allowanceEnabled: false,
            createdAt: "2026-06-01T10:00:00Z",
            updatedAt: "2026-06-01T10:00:00Z",
          },
        ],
        page: 0,
        size: 12,
        totalItems: 1,
        totalPages: 1,
      }),
    );

    mockFetchUrl("/api/family-members/member-4/archive", (input, init) => {
      if (init?.method === "PATCH") {
        return mockErrorResponse(500, "Server error");
      }
      return mockErrorResponse(404);
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/family"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FamilyPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Bob")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Bob/ }));

    const archiveButton = await screen.findByRole("button", {
      name: t("common.archive"),
    });
    fireEvent.click(archiveButton);

    const alertDialog = screen.getByRole("alertdialog");
    fireEvent.click(within(alertDialog).getByRole("button", { name: t("common.archive") }));

    await waitFor(() => {
      expect(screen.getByText(t("family.statusError"))).toBeInTheDocument();
    });
  });

  it("loads members and validates the create form", async () => {
    setupDefaultMocks();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/family"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FamilyPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Admin")).toBeInTheDocument();
    expect(screen.getByText(t("common.loadedItems", { loaded: 1, total: 1 }))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("family.new") }));
    const drawer = screen.getByRole("dialog");

    fireEvent.change(within(drawer).getByLabelText(t("common.name")), {
      target: { value: "" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("common.email")), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(within(drawer).getByLabelText(t("family.password")), {
      target: { value: "123" },
    });

    fireEvent.click(within(drawer).getByRole("button", { name: t("family.create") }));

    await waitFor(() => {
      expect(screen.getByText(t("validation.requiredName"))).toBeInTheDocument();
      expect(screen.getByText(t("validation.invalidEmail"))).toBeInTheDocument();
      expect(screen.getByText(t("validation.passwordMin8"))).toBeInTheDocument();
    });
  });

  it("shows session expired feedback and preserves typed values when submitting without token", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/family"]}>
        <TestAuthProvider
          authOverrides={{ accessToken: null }}
          user={{ id: "1", name: "Admin", email: "admin@bolso-em-dia.local", role: "ADMIN" }}
        >
          <FamilyPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: t("family.new") }));
    const drawer = screen.getByRole("dialog");
    const nameInput = within(drawer).getByLabelText(t("common.name"));

    fireEvent.change(nameInput, { target: { value: "Taylor" } });
    fireEvent.change(within(drawer).getByLabelText(t("common.email")), { target: { value: "taylor@local.test" } });
    fireEvent.change(within(drawer).getByLabelText(t("family.password")), { target: { value: "password123" } });
    fireEvent.click(within(drawer).getByRole("button", { name: t("family.create") }));

    expect(await screen.findByText(t("common.sessionExpired"))).toBeInTheDocument();
    expect(nameInput).toHaveValue("Taylor");
  });
});
