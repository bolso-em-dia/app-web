import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import { t } from "../../test/i18n";
import ConfirmAction from "./ConfirmAction";

function renderConfirmAction(props: Partial<React.ComponentProps<typeof ConfirmAction>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const utils = render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TestAuthProvider
        user={{
          id: "1",
          name: "Admin",
          email: "admin@bolso-em-dia.local",
          role: "ADMIN",
          allowanceEnabled: false,
        }}
      >
        <ConfirmAction
          open
          title="Confirm action"
          message="Are you sure?"
          confirmLabel="Confirm"
          onConfirm={onConfirm}
          onCancel={onCancel}
          {...props}
        />
      </TestAuthProvider>
    </MemoryRouter>,
  );
  return { ...utils, onConfirm, onCancel };
}

describe("ConfirmAction", () => {
  it("renders nothing when closed", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TestAuthProvider
          user={{
            id: "1",
            name: "Admin",
            email: "admin@bolso-em-dia.local",
            role: "ADMIN",
            allowanceEnabled: false,
          }}
        >
          <ConfirmAction open={false} title="Hidden" message="Hidden" confirmLabel="OK" onConfirm={vi.fn()} onCancel={vi.fn()} />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("renders title and message when open", () => {
    renderConfirmAction();

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Confirm action")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("confirm button calls onConfirm", () => {
    const { onConfirm } = renderConfirmAction();

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cancel button inside dialog calls onCancel", () => {
    const { onCancel } = renderConfirmAction();

    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(dialog.querySelector('button[type="button"]:not([aria-label])') as HTMLElement);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("backdrop click calls onCancel", () => {
    const { onCancel } = renderConfirmAction();

    fireEvent.click(screen.getByLabelText(t("common.cancel")));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("confirm button is disabled when loading", () => {
    renderConfirmAction({ loading: true });

    const dialog = screen.getByRole("alertdialog");
    const buttons = dialog.querySelectorAll("button");
    const confirmBtn = Array.from(buttons).find((b) => b.textContent === t("common.loading"));
    expect(confirmBtn).toBeTruthy();
    expect(confirmBtn).toBeDisabled();
  });

  it("cancel button is disabled during loading", () => {
    renderConfirmAction({ loading: true });

    const dialog = screen.getByRole("alertdialog");
    const cancelBtn = Array.from(dialog.querySelectorAll("button")).find((b) => b.textContent === t("common.cancel"));
    expect(cancelBtn).toBeTruthy();
    expect(cancelBtn).toBeDisabled();
  });

  it("uses role alertdialog with aria-modal", () => {
    renderConfirmAction();

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("renders children when provided", () => {
    renderConfirmAction({
      children: <div data-testid="custom-content">Custom</div>,
    });

    expect(screen.getByTestId("custom-content")).toBeInTheDocument();
  });
});
