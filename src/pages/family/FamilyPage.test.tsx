import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import FamilyPage from "./FamilyPage";

describe("FamilyPage", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: "member-1",
          name: "Admin",
          email: "admin@my-money.local",
          role: "ADMIN",
          active: true,
          allowanceEnabled: false,
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

  it("loads members and validates the create form", async () => {
    render(
      <MemoryRouter initialEntries={["/family"]}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@my-money.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <FamilyPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Admin")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New member" }));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create member" }));

    await waitFor(() => {
      expect(screen.getByText("Name is required.")).toBeInTheDocument();
      expect(
        screen.getByText("Enter a valid email address."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Password must have at least 8 characters."),
      ).toBeInTheDocument();
    });
  });
});
