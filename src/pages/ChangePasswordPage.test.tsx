import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TestAuthProvider } from "../app/auth/TestAuthProvider";
import { mockErrorResponse, mockFetchUrl, resetFetchMocks } from "../test/setup";
import { t } from "../test/i18n";
import ChangePasswordPage from "./ChangePasswordPage";

function renderChangePasswordPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/change-password"]}>
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
  beforeEach(() => {
    resetFetchMocks();
  });

  it("renders the password change form with first-access labels", () => {
    renderChangePasswordPage();
    expect(screen.getByText(t("settings.password.firstAccessTitle"))).toBeInTheDocument();
    expect(screen.getByText(t("settings.password.firstAccessSubtitle"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("settings.password.firstAccessSave") })).toBeInTheDocument();
    expect(screen.getByLabelText(t("settings.password.current"))).toBeInTheDocument();
    expect(screen.getByLabelText(t("settings.password.new"))).toBeInTheDocument();
    expect(screen.getByLabelText(t("settings.password.confirm"))).toBeInTheDocument();
  });

  it("shows session expired feedback and preserves typed values when submitting without token", async () => {
    render(
      <MemoryRouter initialEntries={["/change-password"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TestAuthProvider
          authOverrides={{ accessToken: null }}
          user={{ id: "1", name: "Admin", email: "admin@bolso-em-dia.local", role: "ADMIN", allowanceEnabled: false }}
        >
          <ChangePasswordPage />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const currentPasswordInput = screen.getByLabelText(t("settings.password.current"));
    fireEvent.change(currentPasswordInput, { target: { value: "admin123456" } });
    fireEvent.change(screen.getByLabelText(t("settings.password.new")), { target: { value: "novaSenha123" } });
    fireEvent.change(screen.getByLabelText(t("settings.password.confirm")), { target: { value: "novaSenha123" } });
    fireEvent.click(screen.getByRole("button", { name: t("settings.password.firstAccessSave") }));

    expect(await screen.findByText(t("common.sessionExpired"))).toBeInTheDocument();
    expect(currentPasswordInput).toHaveValue("admin123456");
  });

  it("shows mapped backend feedback when password change fails", async () => {
    mockFetchUrl(
      "/api/auth/change-password",
      mockErrorResponse(
        422,
        JSON.stringify({
          status: 422,
          code: 42216,
          error: "Unprocessable Entity",
          message: "Current password is incorrect.",
        }),
      ),
    );

    renderChangePasswordPage();

    fireEvent.change(screen.getByLabelText(t("settings.password.current")), { target: { value: "admin123456" } });
    fireEvent.change(screen.getByLabelText(t("settings.password.new")), { target: { value: "novaSenha123" } });
    fireEvent.change(screen.getByLabelText(t("settings.password.confirm")), { target: { value: "novaSenha123" } });
    fireEvent.click(screen.getByRole("button", { name: t("settings.password.firstAccessSave") }));

    expect(await screen.findByText(t("error.incorrectCurrentPassword"))).toBeInTheDocument();
    expect(screen.getByLabelText(t("settings.password.current"))).toHaveValue("admin123456");
  });
});
