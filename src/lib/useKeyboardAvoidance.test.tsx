import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useKeyboardAvoidance from "./useKeyboardAvoidance";

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

describe("useKeyboardAvoidance", () => {
  beforeEach(() => {
    setInnerHeight(800);
  });

  afterEach(() => {
    removeVisualViewportMock();
  });

  it("reports zero inset while the keyboard is closed (visual viewport matches layout viewport)", () => {
    installVisualViewportMock({ height: 800, offsetTop: 0 });

    const { result } = renderHook(() => useKeyboardAvoidance(true));

    expect(result.current.keyboardInset).toBe(0);
    expect(result.current.dockStyle["--keyboard-inset"]).toBe("0px");
    expect(result.current.dockStyle["--keyboard-active"]).toBeUndefined();
  });

  it("computes the keyboard height when only the visual viewport shrinks (iOS / resizes-visual)", async () => {
    const viewport = installVisualViewportMock({ height: 800, offsetTop: 0 });

    const { result } = renderHook(() => useKeyboardAvoidance(true));

    act(() => {
      viewport.height = 520;
      viewport.dispatch("resize");
    });

    await waitFor(() => {
      expect(result.current.keyboardInset).toBe(280);
      expect(result.current.dockStyle["--keyboard-inset"]).toBe("280px");
      expect(result.current.dockStyle["--keyboard-active"]).toBe("1");
    });
  });

  it("keeps the inset at zero when the layout viewport shrinks together with the keyboard (Android resizes-content)", async () => {
    const viewport = installVisualViewportMock({ height: 800, offsetTop: 0 });

    const { result } = renderHook(() => useKeyboardAvoidance(true));

    act(() => {
      setInnerHeight(520);
      viewport.height = 520;
      window.dispatchEvent(new Event("resize"));
      viewport.dispatch("resize");
    });

    await waitFor(() => {
      expect(result.current.keyboardInset).toBe(0);
      expect(result.current.dockStyle["--keyboard-inset"]).toBe("0px");
      expect(result.current.dockStyle["--keyboard-active"]).toBeUndefined();
    });
  });

  it("subtracts visualViewport.offsetTop when the page is scrolled", async () => {
    const viewport = installVisualViewportMock({ height: 800, offsetTop: 0 });

    const { result } = renderHook(() => useKeyboardAvoidance(true));

    act(() => {
      viewport.height = 520;
      viewport.offsetTop = 100;
      viewport.dispatch("resize");
    });

    await waitFor(() => {
      // 800 - (520 + 100) = 180
      expect(result.current.keyboardInset).toBe(180);
    });
  });

  it("clamps negative insets to zero", async () => {
    const viewport = installVisualViewportMock({ height: 800, offsetTop: 0 });

    const { result } = renderHook(() => useKeyboardAvoidance(true));

    act(() => {
      viewport.height = 800;
      viewport.offsetTop = 120;
      viewport.dispatch("scroll");
    });

    await waitFor(() => {
      expect(result.current.keyboardInset).toBe(0);
    });
  });

  it("keeps the inset at zero when visualViewport is unavailable", () => {
    removeVisualViewportMock();

    const { result } = renderHook(() => useKeyboardAvoidance(true));

    expect(result.current.keyboardInset).toBe(0);
    expect(result.current.dockStyle["--keyboard-inset"]).toBe("0px");
  });

  it("detaches listeners and reports zero inset while disabled", () => {
    const viewport = installVisualViewportMock({ height: 800, offsetTop: 0 });

    const { result, rerender } = renderHook(({ enabled }) => useKeyboardAvoidance(enabled), {
      initialProps: { enabled: true },
    });

    act(() => {
      viewport.height = 520;
      viewport.dispatch("resize");
    });

    expect(result.current.keyboardInset).toBe(280);

    rerender({ enabled: false });

    expect(result.current.keyboardInset).toBe(0);
    expect(result.current.dockStyle["--keyboard-active"]).toBeUndefined();

    // After disabling, visual viewport changes must not move the inset anymore.
    act(() => {
      viewport.height = 400;
      viewport.dispatch("resize");
    });

    expect(result.current.keyboardInset).toBe(0);
    expect(viewport.removeEventListener).toHaveBeenCalled();
  });
});
