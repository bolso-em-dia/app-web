import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import AccountsPage from "./AccountsPage";

describe("AccountsPage", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: "account-1",
          name: "Main checking",
          type: "CHECKING",
          brand: null,
          color: "#2254d1",
          closingDay: null,
          dueDay: null,
          createdInMonth: "2026-06-01",
          archivedFromMonth: null,
          createdAt: "2026-06-01T10:00:00Z",
          updatedAt: "2026-06-01T10:00:00Z",
        },
      ],
      text: async () => "",
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads accounts and validates credit card fields", async () => {
    render(
      <MemoryRouter initialEntries={["/accounts"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@my-money.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <AccountsPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Main checking")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New account" }));
    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "CREDIT_CARD" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(
        screen.getByText("Brand is required for credit cards."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Closing day is required for credit cards."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Due day is required for credit cards."),
      ).toBeInTheDocument();
    });
  });
});
