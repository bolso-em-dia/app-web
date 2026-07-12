import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import Button from "./Button";

function renderButton(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <TestAuthProvider
        user={{
          id: "1",
          name: "Admin",
          email: "admin@bolso-em-dia.local",
          role: "ADMIN",
          allowanceEnabled: false,
        }}
      >
        {ui}
      </TestAuthProvider>
    </MemoryRouter>,
  );
}

describe("Button", () => {
  it("renders with default primary variant", () => {
    renderButton(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    renderButton(<Button variant="danger">Delete</Button>);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveClass(/danger/);
  });

  it("applies fullWidth class", () => {
    renderButton(<Button fullWidth>Wide</Button>);
    const button = screen.getByRole("button", { name: "Wide" });
    expect(button.className).toMatch(/fullWidth/);
  });

  it("shows loading text and is disabled when loading", () => {
    renderButton(<Button loading>Save</Button>);
    const button = screen.getByRole("button", { name: "Carregando..." });
    expect(button).toBeDisabled();
  });

  it("merges disabled with loading (disabled wins)", () => {
    renderButton(
      <Button disabled loading>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Carregando..." });
    expect(button).toBeDisabled();
  });
});
