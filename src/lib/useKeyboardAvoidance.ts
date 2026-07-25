import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

/**
 * Tracks the on-screen keyboard height via the Visual Viewport API.
 *
 * When enabled, listens to visualViewport resize/scroll and window resize
 * events to compute the keyboard height. Exposes the raw inset value and
 * ready-to-use CSS custom properties for positioning fixed elements above
 * the keyboard.
 *
 * @param enabled - When false, cleans up listeners and resets inset to 0.
 */
export default function useKeyboardAvoidance(enabled: boolean) {
  const [keyboardInset, setKeyboardInset] = useState(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) {
      setKeyboardInset(0);
      return;
    }

    function updateKeyboardInset() {
      if (!enabledRef.current) {
        return;
      }

      const viewport = window.visualViewport;

      if (!viewport) {
        setKeyboardInset(0);
        return;
      }

      const nextInset = Math.max(0, window.innerHeight - (viewport.height + viewport.offsetTop));
      setKeyboardInset(nextInset);
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

  const dockStyle = useMemo<CSSProperties>(
    () => ({
      "--mobile-search-keyboard-inset": `${keyboardInset}px`,
      ...(keyboardInset > 0 ? ({ "--mobile-search-padding-bottom": "0px" } as CSSProperties) : {}),
    }),
    [keyboardInset],
  );

  return { keyboardInset, dockStyle };
}
