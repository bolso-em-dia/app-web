import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import CategoriesPage from "./CategoriesPage";

describe("CategoriesPage", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input);

      if (url.includes("/api/categories/options")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            {
              id: "cat-1",
              name: "Groceries",
              icon: "shopping-cart",
              color: "#2254d1",
            },
          ],
          text: async () => "",
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: "cat-1",
              name: "Groceries",
              icon: "shopping-cart",
              color: "#2254d1",
              createdInMonth: "2026-06-01",
              archivedFromMonth: null,
              replacementCategoryId: null,
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads categories and validates the create form", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/categories"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <CategoriesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("1-1 de 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nova categoria" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Criar categoria" }));

    await waitFor(() => {
      expect(screen.getByText("Nome é obrigatório.")).toBeInTheDocument();
    });
  });

  it("keeps the search field focused during filtering and removes icon/color text from the card", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/categories"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <CategoriesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Groceries")).toBeInTheDocument();

    const searchInput = screen.getByRole("textbox", { name: "Buscar" });
    searchInput.focus();

    fireEvent.change(searchInput, { target: { value: "Gro" } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    expect(searchInput).toHaveFocus();
    expect(screen.queryByText("Compras")).not.toBeInTheDocument();
    expect(screen.queryByText("#2254d1")).not.toBeInTheDocument();
    const categoryButton = screen.getByRole("button", { name: /Groceries/ });
    const categoryIcon = categoryButton.querySelector('span[style]');

    expect(categoryIcon).not.toBeNull();
    expect(categoryIcon).toHaveStyle({ color: "rgb(34, 84, 209)" });
  });
  it("preserves active filters after create and refetches the list with the same query", async () => {
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/api/categories/options")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            {
              id: "cat-1",
              name: "Groceries",
              icon: "shopping-cart",
              color: "#2254d1",
            },
          ],
          text: async () => "",
        } as Response);
      }

      if (method === "POST") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: "cat-2",
            name: "Travel",
            icon: null,
            color: null,
            createdInMonth: "2026-06-01",
            archivedFromMonth: null,
            replacementCategoryId: null,
            createdAt: "2026-06-01T10:00:00Z",
            updatedAt: "2026-06-01T10:00:00Z",
          }),
          text: async () => "",
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: "cat-1",
              name: "Groceries",
              icon: "shopping-cart",
              color: "#2254d1",
              createdInMonth: "2026-06-01",
              archivedFromMonth: null,
              replacementCategoryId: null,
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

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/categories"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <CategoriesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    await screen.findByText("Groceries");

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar" }), {
      target: { value: "Gro" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filtros (1)" }));
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "ACTIVE" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Nova categoria" }));
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Travel" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Criar categoria" }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Buscar" })).toHaveValue(
        "Gro",
      );
    });

    if (!screen.queryByLabelText("Status")) {
      fireEvent.click(screen.getByRole("button", { name: "Filtros (1)" }));
    }

    expect(screen.getByLabelText("Status")).toHaveValue("ACTIVE");

    const categoryRequests = vi
      .mocked(fetch)
      .mock.calls.map(([input]) => String(input))
      .filter((url) => url.includes("/api/categories?") && !url.includes("options"));

    expect(categoryRequests.some((url) => url.includes("search=Gro"))).toBe(
      true,
    );
    expect(categoryRequests.some((url) => url.includes("status=ACTIVE"))).toBe(
      true,
    );
  });

});
