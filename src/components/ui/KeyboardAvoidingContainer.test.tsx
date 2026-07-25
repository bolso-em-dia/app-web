import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import KeyboardAvoidingContainer from "./KeyboardAvoidingContainer";

type VisualViewportMock = {
  height: number;
  offsetTop: number;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatch: (eventName: "resize" | "scroll") => void;
};

function setInnerHeight(value: number) {
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value,
    writable: true,
  });
}

function installVisualViewportMock({ height, offsetTop }: { height: number; offsetTop: number }): VisualViewportMock {
  const listeners = new Map<string, Set<() => void>>();
  const addEventListener = vi.fn((eventName: string, listener: () => void) => {
    const group = listeners.get(eventName) ?? new Set<() => void>();
    group.add(listener);
    listeners.set(eventName, group);
  });
  const removeEventListener = vi.fn((eventName: string, listener: () => void) => {
    listeners.get(eventName)?.delete(listener);
  });
  const viewport = {
    height,
    offsetTop,
    addEventListener,
    removeEventListener,
    dispatch(eventName: "resize" | "scroll") {
      listeners.get(eventName)?.forEach((listener) => listener());
    },
  };

  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: viewport,
  });

  return viewport;
}

function removeVisualViewportMock() {
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: undefined,
  });
}

describe("KeyboardAvoidingContainer", () => {
  afterEach(() => {
    removeVisualViewportMock();
  });

  it("renders its children inside a region with the requested role", () => {
    render(
      <KeyboardAvoidingContainer role="search">
        <input aria-label="Buscar" />
      </KeyboardAvoidingContainer>,
    );

    const region = screen.getByRole("search");
    expect(screen.getByLabelText("Buscar")).toBeInTheDocument();
    expect(region).toContainElement(screen.getByLabelText("Buscar"));
  });

  it("merges the consumer className with the positioning classes", () => {
    render(
      <KeyboardAvoidingContainer className="my-dock" role="region">
        content
      </KeyboardAvoidingContainer>,
    );

    expect(screen.getByRole("region")).toHaveClass("my-dock");
  });

  it("exposes the keyboard-inset custom property and lifts when the keyboard opens", async () => {
    setInnerHeight(800);
    const viewport = installVisualViewportMock({ height: 800, offsetTop: 0 });

    render(
      <KeyboardAvoidingContainer role="search">
        <input aria-label="Buscar" />
      </KeyboardAvoidingContainer>,
    );

    const region = screen.getByRole("search");
    expect(region).toHaveStyle("--keyboard-inset: 0px");
    expect(region).not.toHaveStyle("--keyboard-active: 1");

    act(() => {
      viewport.height = 520;
      viewport.dispatch("resize");
    });

    await waitFor(() => {
      expect(region).toHaveStyle("--keyboard-inset: 280px");
      expect(region).toHaveStyle("--keyboard-active: 1");
    });
  });

  it("does not lift when disabled", async () => {
    setInnerHeight(800);
    const viewport = installVisualViewportMock({ height: 800, offsetTop: 0 });

    render(
      <KeyboardAvoidingContainer enabled={false} role="search">
        <input aria-label="Buscar" />
      </KeyboardAvoidingContainer>,
    );

    const region = screen.getByRole("search");
    expect(region).toHaveStyle("--keyboard-inset: 0px");

    act(() => {
      viewport.height = 520;
      viewport.dispatch("resize");
    });

    await waitFor(() => {
      expect(region).toHaveStyle("--keyboard-inset: 0px");
      expect(region).not.toHaveStyle("--keyboard-active: 1");
    });
  });

  it("omits the action-bar reservation variant when requested", () => {
    render(
      <KeyboardAvoidingContainer reserveActionBarSpace={false} role="region">
        content
      </KeyboardAvoidingContainer>,
    );

    expect(screen.getByRole("region").className).toMatch(/noActionBarSpace/);
  });

  it("keeps the resting inset when visualViewport is unavailable", () => {
    removeVisualViewportMock();

    render(
      <KeyboardAvoidingContainer role="search">
        <input aria-label="Buscar" />
      </KeyboardAvoidingContainer>,
    );

    expect(screen.getByRole("search")).toHaveStyle("--keyboard-inset: 0px");
  });

  it("forwards extra HTML attributes to the container element", () => {
    render(
      <KeyboardAvoidingContainer aria-label="Dock de busca" role="search">
        content
      </KeyboardAvoidingContainer>,
    );

    expect(screen.getByRole("search")).toHaveAttribute("aria-label", "Dock de busca");
  });
});
