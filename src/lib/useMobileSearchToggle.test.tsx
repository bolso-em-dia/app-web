import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMobileSearchToggle } from "./useMobileSearchToggle";

describe("useMobileSearchToggle", () => {
  let nextFrameId: number;
  let callbacks: Map<number, FrameRequestCallback>;

  function runAnimationFrame(frameId: number) {
    const callback = callbacks.get(frameId);

    if (!callback) {
      return;
    }

    callbacks.delete(frameId);
    callback(performance.now());
  }

  beforeEach(() => {
    nextFrameId = 0;
    callbacks = new Map<number, FrameRequestCallback>();

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback: FrameRequestCallback) => {
      nextFrameId += 1;
      callbacks.set(nextFrameId, callback);
      return nextFrameId;
    });

    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((frameId: number) => {
      callbacks.delete(frameId);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("focuses the input without scrolling when opening the mobile search", () => {
    const focus = vi.fn();
    const { result } = renderHook(() => useMobileSearchToggle());

    act(() => {
      result.current.inputRef.current = { focus } as unknown as HTMLInputElement;
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      runAnimationFrame(1);
    });

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("cancels pending focus when the mobile search closes before the frame runs", () => {
    const focus = vi.fn();
    const { result } = renderHook(() => useMobileSearchToggle());

    act(() => {
      result.current.inputRef.current = { focus } as unknown as HTMLInputElement;
      result.current.open();
      result.current.close();
    });

    act(() => {
      runAnimationFrame(1);
    });

    expect(focus).not.toHaveBeenCalled();
  });

  it("falls back to plain focus when the browser does not support preventScroll", () => {
    const focus = vi
      .fn<(options?: FocusOptions) => void>()
      .mockImplementationOnce(() => {
        throw new TypeError("preventScroll unsupported");
      })
      .mockImplementation(() => undefined);
    const { result } = renderHook(() => useMobileSearchToggle());

    act(() => {
      result.current.inputRef.current = { focus } as unknown as HTMLInputElement;
      result.current.open();
    });

    act(() => {
      runAnimationFrame(1);
    });

    expect(focus).toHaveBeenNthCalledWith(1, { preventScroll: true });
    expect(focus).toHaveBeenNthCalledWith(2);
  });

  it("blurs the focused input when closing the mobile search", () => {
    const focus = vi.fn();
    const blur = vi.fn();
    const input = { focus, blur } as unknown as HTMLInputElement;
    const { result } = renderHook(() => useMobileSearchToggle());

    act(() => {
      result.current.inputRef.current = input;
      result.current.open();
    });

    act(() => {
      runAnimationFrame(1);
    });

    expect(focus).toHaveBeenCalled();

    Object.defineProperty(document, "activeElement", {
      configurable: true,
      value: input,
    });

    act(() => {
      result.current.close();
    });

    expect(blur).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });
});
