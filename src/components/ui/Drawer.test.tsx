import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Drawer from "./Drawer";

describe("Drawer", () => {
  it("renders an icon-only close button with accessible label", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Drawer onClose={onClose} title="Detalhes">
        <div>content</div>
      </Drawer>,
    );

    const closeButtons = screen.getAllByLabelText("Fechar painel");

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

    const closeButtons = screen.getAllByLabelText("Fechar painel");

    expect(closeButtons).toHaveLength(1);

    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
