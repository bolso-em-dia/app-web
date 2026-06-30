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
import EnvelopesPage from "./EnvelopesPage";

describe("EnvelopesPage", () => {
  beforeEach(() => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: "env-1",
              name: "Household",
              type: "GLOBAL",
              ownerMemberId: null,
              ownerMemberName: null,
              monthlyLimit: 1200,
              consumedAmount: 320,
              remainingAmount: 880,
              createdInMonth: "2026-06-01",
              archivedFromMonth: null,
              active: true,
              categories: [
                {
                  id: "cat-1",
                  name: "Groceries",
                  color: "#2254d1",
                },
              ],
              transactions: [],
            },
          ],
          page: 0,
          size: 12,
          totalItems: 1,
          totalPages: 1,
        }),
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
          {
            id: "cat-2",
            name: "Transport",
            icon: "car",
            color: "#14a44d",
          },
        ],
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: "member-1",
              name: "Taylor",
              email: "taylor@my-money.local",
              role: "USER",
              active: true,
              allowanceEnabled: true,
              createdAt: "2026-06-01T10:00:00Z",
              updatedAt: "2026-06-01T10:00:00Z",
            },
          ],
          page: 0,
          size: 200,
          totalItems: 1,
          totalPages: 1,
        }),
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: "env-1",
          name: "Household",
          type: "GLOBAL",
          ownerMemberId: null,
          ownerMemberName: null,
          monthlyLimit: 1200,
          consumedAmount: 320,
          remainingAmount: 880,
          createdInMonth: "2026-06-01",
          archivedFromMonth: null,
          active: true,
          categories: [
            {
              id: "cat-1",
              name: "Groceries",
              color: "#2254d1",
            },
          ],
          transactions: [],
        }),
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            categoryId: "cat-1",
            categoryName: "Groceries",
            amount: 320,
          },
        ],
        text: async () => "",
      } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads envelopes and validates envelope-specific fields", async () => {
    render(
      <MemoryRouter initialEntries={["/envelopes"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@my-money.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <EnvelopesPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Household")).toBeInTheDocument();
    expect(screen.getByText("1-1 of 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New envelope" }));
    const drawer = screen.getByRole("dialog");

    fireEvent.change(within(drawer).getByLabelText("Name"), {
      target: { value: "Allowance envelope" },
    });
    fireEvent.change(within(drawer).getByLabelText("Monthly limit"), {
      target: { value: "450" },
    });
    fireEvent.change(within(drawer).getByLabelText("Type"), {
      target: { value: "ALLOWANCE" },
    });

    fireEvent.click(
      within(drawer).getByRole("button", { name: "Create envelope" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Owner member is required for allowance envelopes."),
      ).toBeInTheDocument();
    });
  });
});
