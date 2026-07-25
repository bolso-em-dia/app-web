import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import { t } from "../../test/i18n";
import ConfirmAction from "./ConfirmAction";

function renderConfirmAction(props: Partial<React.ComponentProps<typeof ConfirmAction>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const utils = render(
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

    fireEvent.click(screen.getByRole("button", { name: t("common.cancel") }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("backdrop click calls onCancel", () => {
    const { onCancel } = renderConfirmAction();

    fireEvent.click(screen.getByTestId("confirm-action-backdrop"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("confirm button is disabled when loading", () => {
    renderConfirmAction({ loading: true });

    expect(screen.getByRole("button", { name: t("common.loading") })).toBeDisabled();
  });

  it("cancel button is disabled during loading", () => {
    renderConfirmAction({ loading: true });

    expect(screen.getByRole("button", { name: t("common.cancel") })).toBeDisabled();
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

  it("closes on Escape and notifies cancellation", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    function Harness() {
      const [open, setOpen] = useState(false);

      return (
        <>
          <button onClick={() => setOpen(true)} type="button">
            Abrir confirmação
          </button>
          <ConfirmAction
            confirmLabel="Confirm"
            message="Are you sure?"
            onCancel={() => {
              onCancel();
              setOpen(false);
            }}
            onConfirm={onConfirm}
            open={open}
            title="Confirm action"
          />
        </>
      );
    }

    render(
      <MemoryRouter>
        <TestAuthProvider user={{ id: "1", name: "Admin", email: "admin@bolso-em-dia.local", role: "ADMIN", allowanceEnabled: false }}>
          <Harness />
        </TestAuthProvider>
      </MemoryRouter>,
    );

    const trigger = screen.getByRole("button", { name: "Abrir confirmação" });
    fireEvent.click(trigger);

    const dialog = screen.getByRole("alertdialog");
    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: t("common.cancel") })).toHaveFocus();
    });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
