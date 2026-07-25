import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

/**
 * Tracks the on-screen keyboard height via the Visual Viewport API.
 *
 * When enabled, captures the maximum window.innerHeight as a baseline and
 * computes the keyboard height as baseline - visualViewport.height. This
 * works correctly on both iOS (where innerHeight stays constant) and
 * Android (where innerHeight may resize with the keyboard).
 *
 * @param enabled - When false, cleans up listeners and resets state.
 */
export default function useKeyboardAvoidance(enabled: boolean) {
  const [keyboardInset, setKeyboardInset] = useState(0);
  const enabledRef = useRef(enabled);
  const baselineInnerHeightRef = useRef(window.innerHeight);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) {
      baselineInnerHeightRef.current = window.innerHeight;
      setKeyboardInset(0);
      return;
    }

    baselineInnerHeightRef.current = Math.max(baselineInnerHeightRef.current, window.innerHeight);

    function updateKeyboardInset() {
      if (!enabledRef.current) {
        return;
      }

      const viewport = window.visualViewport;

      if (!viewport) {
        setKeyboardInset(0);
        return;
      }

      if (window.innerHeight > baselineInnerHeightRef.current) {
        baselineInnerHeightRef.current = window.innerHeight;
      }

      const keyboardHeight = Math.max(0, baselineInnerHeightRef.current - (viewport.height + viewport.offsetTop));
      setKeyboardInset(keyboardHeight);
    }

    updateKeyboardInset();

    const viewport = window.visualViewport;
    window.addEventListener("resize", updateKeyboardInset);
    viewport?.addEventListener("resize", updateKeyboardInset);
    viewport?.addEventListener("scroll", updateKeyboardInset);

    return () => {
      window.removeEventListener("resize", updateKeyboardInset);
      viewport?.removeEventListener("resize", updateKeyboardInset);
      viewport?.removeEventListener("scroll", updateKeyboardInset);
    };
  }, [enabled]);

  const keyboardActive = keyboardInset > 0;

  const dockStyle = useMemo<CSSProperties>(
    () => ({
      "--mobile-search-keyboard-inset": `${keyboardInset}px`,
      ...(keyboardActive ? ({ "--mobile-keyboard-active": "1" } as CSSProperties) : {}),
    }),
    [keyboardInset, keyboardActive],
  );

  return { keyboardInset, dockStyle };
}
