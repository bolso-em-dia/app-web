import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

/**
 * Tracks the on-screen keyboard height via the Visual Viewport API.
 *
 * The inset is computed against the **current** layout viewport height
 * (`window.innerHeight`), which is what `position: fixed` is anchored to. This
 * avoids double-offsetting the dock on browsers that resize the layout viewport
 * together with the keyboard (Chromium `interactive-widget=resizes-content`):
 *
 * - iOS Safari and Chromium `resizes-visual` (default): the layout viewport
 *   stays at full height, so the inset equals the keyboard height.
 * - Chromium `resizes-content`: the layout viewport shrinks together with the
 *   visual viewport, so the inset resolves to 0 and the dock stays anchored to
 *   the already-shrunk viewport (no double count).
 *
 * @param enabled - When false, cleans up listeners and resets state.
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

      const layoutViewportHeight = window.innerHeight;
      const visualViewportBottom = viewport.height + viewport.offsetTop;
      const keyboardHeight = Math.max(0, layoutViewportHeight - visualViewportBottom);
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
      "--keyboard-inset": `${keyboardInset}px`,
      ...(keyboardActive ? ({ "--keyboard-active": "1" } as CSSProperties) : {}),
    }),
    [keyboardInset, keyboardActive],
  );

  return { keyboardInset, dockStyle };
}
