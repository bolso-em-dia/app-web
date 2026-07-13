import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TestAuthProvider } from "../app/auth/TestAuthProvider";
import { t } from "../test/i18n";
import ErrorBoundary from "./ErrorBoundary";

afterEach(() => {
  vi.clearAllMocks();
});

function renderWithErrorBoundary(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <TestAuthProvider
        user={{
          id: "1",
          name: "Admin",
          email: "admin@bolso-em-dia.local",
          role: "ADMIN",
          allowanceEnabled: false,
        }}
      >
        <ErrorBoundary>{ui}</ErrorBoundary>
      </TestAuthProvider>
    </MemoryRouter>,
  );
}

function ThrowingComponent() {
  throw new Error("Test error message");
}

function NormalComponent() {
  return <div>Normal content</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    renderWithErrorBoundary(<NormalComponent />);
    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("shows fallback UI when child component throws", () => {
    renderWithErrorBoundary(<ThrowingComponent />);
    expect(screen.getByText(t("errorBoundary.title"))).toBeInTheDocument();
    expect(screen.getByText(t("errorBoundary.message"))).toBeInTheDocument();
  });

  it("shows error details in expandable section", () => {
    renderWithErrorBoundary(<ThrowingComponent />);
    const details = screen.getByText(t("errorBoundary.details"));
    expect(details.tagName).toBe("SUMMARY");
    expect(details.closest("details")).toBeInTheDocument();
  });

  it("retry button resets error state", () => {
    let shouldThrow = true;
    function ConditionalThrow() {
      if (shouldThrow) throw new Error("Test error");
      return <div>Recovered</div>;
    }

    renderWithErrorBoundary(<ConditionalThrow />);
    expect(screen.getByText(t("errorBoundary.title"))).toBeInTheDocument();

    shouldThrow = false;
    const retryButton = screen.getByRole("button", {
      name: t("errorBoundary.retry"),
    });
    fireEvent.click(retryButton);

    expect(screen.getByText("Recovered")).toBeInTheDocument();
  });

  it("go to dashboard button navigates to /dashboard", () => {
    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

    renderWithErrorBoundary(<ThrowingComponent />);
    const dashboardButton = screen.getByRole("button", {
      name: t("errorBoundary.goToDashboard"),
    });
    fireEvent.click(dashboardButton);
    expect(assignMock).toHaveBeenCalledWith("/dashboard");

    vi.unstubAllGlobals();
  });
});
