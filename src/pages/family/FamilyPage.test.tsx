import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import FamilyPage from "./FamilyPage";

describe("FamilyPage", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
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
      }),
      text: async () => "",
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens "Arquivar membro" confirmation for an active member', async () => {
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
      name: "Arquivar membro",
    });
    fireEvent.click(archiveButton);

    const alertDialog = screen.getByRole("alertdialog");
    expect(alertDialog).toBeInTheDocument();
    expect(
      within(alertDialog).getByText(
        "Tem certeza que deseja arquivar este membro? Ele não poderá mais fazer login.",
      ),
    ).toBeInTheDocument();
  });

  it('opens "Reativar membro" confirmation for an inactive member', async () => {
    vi.mocked(fetch).mockReset();
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "GET" && url.includes("/api/family-members?")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
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
          text: async () => "",
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => "",
      } as Response);
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

    expect(await screen.findByText("Jane")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Jane/ }));

    const restoreButton = await screen.findByRole("button", {
      name: "Reativar membro",
    });
    fireEvent.click(restoreButton);

    const alertDialog = screen.getByRole("alertdialog");
    expect(alertDialog).toBeInTheDocument();
    expect(
      within(alertDialog).getByText(
        "Tem certeza que deseja reativar este membro?",
      ),
    ).toBeInTheDocument();
  });

  it("confirms archive and calls PATCH /api/family-members/{id}/archive", async () => {
    vi.mocked(fetch).mockReset();
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "GET" && url.includes("/api/family-members?")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
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
          text: async () => "",
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          id: "member-3",
          name: "Alice",
          email: "alice@bolso-em-dia.local",
          role: "USER",
          active: false,
          allowanceEnabled: false,
          createdAt: "2026-06-01T10:00:00Z",
          updatedAt: "2026-07-09T10:00:00Z",
        }),
        text: async () => "",
      } as Response);
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
      name: "Arquivar membro",
    });
    fireEvent.click(archiveButton);

    const alertDialog = screen.getByRole("alertdialog");
    fireEvent.click(
      within(alertDialog).getByRole("button", { name: "Arquivar membro" }),
    );

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining("/api/family-members/member-3/archive"),
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("shows error feedback when archive fails", async () => {
    vi.mocked(fetch).mockReset();
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "GET" && url.includes("/api/family-members?")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
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
          text: async () => "",
        } as Response);
      }

      if (method === "PATCH" && url.includes("/archive")) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({}),
          text: async () => "",
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => "",
      } as Response);
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
      name: "Arquivar membro",
    });
    fireEvent.click(archiveButton);

    const alertDialog = screen.getByRole("alertdialog");
    fireEvent.click(
      within(alertDialog).getByRole("button", { name: "Arquivar membro" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Não foi possível atualizar o status do membro."),
      ).toBeInTheDocument();
    });
  });

  it("loads members and validates the create form", async () => {
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
    expect(screen.getByText("1-1 de 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Novo membro" }));
    const drawer = screen.getByRole("dialog");

    fireEvent.change(within(drawer).getByLabelText("Nome"), {
      target: { value: "" },
    });
    fireEvent.change(within(drawer).getByLabelText("E-mail"), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(within(drawer).getByLabelText("Senha"), {
      target: { value: "123" },
    });

    fireEvent.click(
      within(drawer).getByRole("button", { name: "Criar membro" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Nome é obrigatório.")).toBeInTheDocument();
      expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
      expect(
        screen.getByText("A senha deve ter pelo menos 8 caracteres."),
      ).toBeInTheDocument();
    });
  });
});
