import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import CategoriesPage from "./CategoriesPage";

describe("CategoriesPage", () => {
  beforeEach(() => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
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
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads categories and validates the create form", async () => {
    render(
      <MemoryRouter initialEntries={["/categories"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@my-money.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <CategoriesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Groceries")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New category" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create category" }));

    await waitFor(() => {
      expect(screen.getByText("Name is required.")).toBeInTheDocument();
    });
  });
});
