import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TestAuthProvider } from "../app/auth/TestAuthProvider";
import { t } from "../test/i18n";
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
    expect(screen.getByText(t("settings.password.firstAccessTitle"))).toBeInTheDocument();
    expect(screen.getByText(t("settings.password.firstAccessSubtitle"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("settings.password.firstAccessSave") })).toBeInTheDocument();
    expect(screen.getByLabelText(t("settings.password.current"))).toBeInTheDocument();
    expect(screen.getByLabelText(t("settings.password.new"))).toBeInTheDocument();
    expect(screen.getByLabelText(t("settings.password.confirm"))).toBeInTheDocument();
  });
});
