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
import {
  resetFetchMocks,
  mockJsonResponse,
  mockErrorResponse,
  mockFetchUrl,
} from "../../test/setup";
import CategoriesPage from "./CategoriesPage";

const defaultCategoryResponse = {
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
};

const defaultCategoriesOptions = [
  {
    id: "cat-1",
    name: "Groceries",
    icon: "shopping-cart",
    color: "#2254d1",
  },
];

function setupDefaultMocks() {
  mockFetchUrl(
    "/api/categories/options",
    mockJsonResponse(defaultCategoriesOptions),
  );
  mockFetchUrl("/api/categories?", mockJsonResponse(defaultCategoryResponse));
}

describe("CategoriesPage", () => {
  beforeEach(() => {
    resetFetchMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads categories and validates the create form", async () => {
    setupDefaultMocks();

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={["/categories"]}
      >
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
    setupDefaultMocks();

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={["/categories"]}
      >
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
      const requests = vi
        .mocked(fetch)
        .mock.calls.map(([input]) => String(input))
        .filter((url) => url.includes("/api/categories?"));
      expect(requests.length).toBeGreaterThanOrEqual(2);
    });

    expect(searchInput).toHaveFocus();
    expect(screen.queryByText("Compras")).not.toBeInTheDocument();
    expect(screen.queryByText("#2254d1")).not.toBeInTheDocument();
    const categoryButton = screen.getByRole("button", { name: /Groceries/ });
    const categoryIcon = categoryButton.querySelector("span[style]");

    expect(categoryIcon).not.toBeNull();
    expect(categoryIcon).toHaveStyle({ color: "rgb(34, 84, 209)" });
  });

  it("preserves active filters after create and refetches the list with the same query", async () => {
    resetFetchMocks();

    setupDefaultMocks();

    // Mock POST response
    mockFetchUrl("/api/categories", (input, init) => {
      if (init?.method === "POST") {
        return mockJsonResponse({
          id: "cat-2",
          name: "Travel",
          icon: null,
          color: null,
          createdInMonth: "2026-06-01",
          archivedFromMonth: null,
          replacementCategoryId: null,
          createdAt: "2026-06-01T10:00:00Z",
          updatedAt: "2026-06-01T10:00:00Z",
        });
      }
      return mockErrorResponse(404);
    });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={["/categories"]}
      >
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
      .filter(
        (url) => url.includes("/api/categories?") && !url.includes("options"),
      );

    expect(categoryRequests.some((url) => url.includes("search=Gro"))).toBe(
      true,
    );
    expect(categoryRequests.some((url) => url.includes("status=ACTIVE"))).toBe(
      true,
    );
  });

  it("opens archive confirmation dialog and cancels without calling the API", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/categories/options",
      mockJsonResponse([
        {
          id: "cat-1",
          name: "Groceries",
          icon: "shopping-cart",
          color: "#2254d1",
        },
        {
          id: "cat-2",
          name: "Utilities",
          icon: "home",
          color: "#e91e63",
        },
      ]),
    );
    mockFetchUrl("/api/categories?", mockJsonResponse(defaultCategoryResponse));

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={["/categories"]}
      >
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

    fireEvent.click(screen.getByRole("button", { name: /Groceries/ }));

    const categorySelectTrigger = await screen.findByRole("button", {
      name: /substituta/,
    });
    fireEvent.click(categorySelectTrigger);

    const listbox = screen.getByRole("listbox");
    fireEvent.click(within(listbox).getByRole("option", { name: /Utilities/ }));

    fireEvent.click(screen.getByRole("button", { name: "Arquivar" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Cancelar",
      }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    const archiveCalls = vi
      .mocked(fetch)
      .mock.calls.filter(
        ([input, init]) =>
          String(input).includes("/archive") && init?.method === "PATCH",
      );
    expect(archiveCalls).toHaveLength(0);
  });

  it("confirms archive and calls PATCH /api/categories/{id}/archive with replacementCategoryId", async () => {
    resetFetchMocks();

    // Configure GET mocks first (more specific URLs)
    mockFetchUrl("/api/categories?", mockJsonResponse(defaultCategoryResponse));

    mockFetchUrl(
      "/api/categories/options",
      mockJsonResponse([
        {
          id: "cat-1",
          name: "Groceries",
          icon: "shopping-cart",
          color: "#2254d1",
        },
        {
          id: "cat-2",
          name: "Utilities",
          icon: "home",
          color: "#e91e63",
        },
      ]),
    );

    // Configure PATCH mock after GET mocks (less specific pattern)
    mockFetchUrl("/api/categories/cat-1/archive", (input, init) => {
      if (init?.method === "PATCH") {
        return mockJsonResponse({
          id: "cat-1",
          name: "Groceries",
          icon: "shopping-cart",
          color: "#2254d1",
          createdInMonth: "2026-06-01",
          archivedFromMonth: "2026-07-01",
          replacementCategoryId: "cat-2",
          createdAt: "2026-06-01T10:00:00Z",
          updatedAt: "2026-07-01T10:00:00Z",
        });
      }
      return mockErrorResponse(404);
    });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={["/categories"]}
      >
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

    fireEvent.click(screen.getByRole("button", { name: /Groceries/ }));

    const categorySelectTrigger = await screen.findByRole("button", {
      name: /substituta/,
    });
    fireEvent.click(categorySelectTrigger);

    const listbox = screen.getByRole("listbox");
    fireEvent.click(within(listbox).getByRole("option", { name: /Utilities/ }));

    fireEvent.click(screen.getByRole("button", { name: "Arquivar" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Arquivar",
      }),
    );

    await waitFor(() => {
      const patchCall = vi
        .mocked(fetch)
        .mock.calls.find(
          ([callInput, callInit]) =>
            String(callInput).includes("/api/categories/cat-1/archive") &&
            callInit?.method === "PATCH",
        );
      expect(patchCall).toBeDefined();
      const body = JSON.parse((patchCall![1] as RequestInit).body as string);
      expect(body.replacementCategoryId).toBe("cat-2");
    });
  });

  it("shows error feedback when archive fails", async () => {
    resetFetchMocks();

    mockFetchUrl(
      "/api/categories/options",
      mockJsonResponse([
        {
          id: "cat-1",
          name: "Groceries",
          icon: "shopping-cart",
          color: "#2254d1",
        },
        {
          id: "cat-2",
          name: "Utilities",
          icon: "home",
          color: "#e91e63",
        },
      ]),
    );

    mockFetchUrl("/api/categories?", mockJsonResponse(defaultCategoryResponse));

    mockFetchUrl("/api/categories/cat-1/archive", (input, init) => {
      if (init?.method === "PATCH") {
        return mockErrorResponse(500, "Server error");
      }
      return mockErrorResponse(404);
    });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={["/categories"]}
      >
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

    fireEvent.click(screen.getByRole("button", { name: /Groceries/ }));

    const categorySelectTrigger = await screen.findByRole("button", {
      name: /substituta/,
    });
    fireEvent.click(categorySelectTrigger);

    const listbox = screen.getByRole("listbox");
    fireEvent.click(within(listbox).getByRole("option", { name: /Utilities/ }));

    fireEvent.click(screen.getByRole("button", { name: "Arquivar" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Arquivar",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Não foi possível arquivar a categoria."),
      ).toBeInTheDocument();
    });
  });
});
