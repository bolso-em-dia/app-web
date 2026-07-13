import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TestAuthProvider } from "../app/auth/TestAuthProvider";
import ChangePasswordPage from "./ChangePasswordPage";

function renderChangePasswordPage() {
  return render(
    <MemoryRouter initialEntries={["/change-password"]}>
      <TestAuthProvider
        user={{
          id: "1",
          name: "Admin",
          email: "admin@bolso-em-dia.local",
          role: "ADMIN",
          allowanceEnabled: false,
        }}
      >
        <ChangePasswordPage />
      </TestAuthProvider>
    </MemoryRouter>,
  );
}

describe("ChangePasswordPage", () => {
  it("renders the password change form with first-access labels", () => {
    renderChangePasswordPage();
    expect(screen.getByText("Defina uma nova senha")).toBeInTheDocument();
    expect(screen.getByText(/O acesso inicial do administrador exige a troca da senha/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar nova senha" })).toBeInTheDocument();
    expect(screen.getByLabelText("Senha atual")).toBeInTheDocument();
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar nova senha")).toBeInTheDocument();
  });
});
