import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { vi } from "vitest";
import { t } from "../../test/i18n";
import Drawer from "./Drawer";

describe("Drawer", () => {
  it("renders an icon-only close button with accessible label", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Drawer onClose={onClose} title="Detalhes">
        <div>content</div>
      </Drawer>,
    );

    const closeButtons = screen.getAllByLabelText(t("common.closeDrawer"));

    expect(closeButtons).toHaveLength(2);
    expect(container.querySelector("aside svg")).toBeTruthy();

    fireEvent.click(closeButtons[1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("can hide the header close button when another close action is rendered elsewhere", () => {
    const onClose = vi.fn();

    render(
      <Drawer hideHeaderCloseButton onClose={onClose} title="Detalhes">
        <div>content</div>
      </Drawer>,
    );

    const closeButtons = screen.getAllByLabelText(t("common.closeDrawer"));

    expect(closeButtons).toHaveLength(1);

    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("moves focus into the drawer on open and restores focus to the trigger on close", async () => {
    const onClose = vi.fn();

    function Harness() {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <>
          <button onClick={() => setIsOpen(true)} type="button">
            Abrir
          </button>
          {isOpen ? (
            <Drawer
              onClose={() => {
                onClose();
                setIsOpen(false);
              }}
              title="Detalhes"
            >
              <input aria-label="Nome" />
            </Drawer>
          ) : null}
        </>
      );
    }

    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Abrir" });
    trigger.focus();
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByLabelText("Nome")).toHaveFocus();
    });

    fireEvent.click(screen.getAllByLabelText(t("common.closeDrawer"))[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });
});
