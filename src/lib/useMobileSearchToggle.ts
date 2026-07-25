import { useCallback, useEffect, useRef, useState } from "react";

export function useMobileSearchToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusRequestRef = useRef(0);
  const frameIdRef = useRef<number | null>(null);

  const cancelPendingFocus = useCallback(() => {
    focusRequestRef.current += 1;

    if (frameIdRef.current !== null) {
      window.cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
  }, []);

  const focusInput = useCallback(() => {
    cancelPendingFocus();
    const requestId = ++focusRequestRef.current;

    frameIdRef.current = window.requestAnimationFrame(() => {
      frameIdRef.current = null;

      if (requestId !== focusRequestRef.current) {
        return;
      }

      const input = inputRef.current;

      if (!input) {
        return;
      }

      try {
        input.focus({ preventScroll: true });
      } catch {
        input.focus();
      }
    });
  }, [cancelPendingFocus]);

  const open = useCallback(() => {
    setIsOpen((current) => {
      if (current) {
        focusInput();
      }

      return true;
    });
  }, [focusInput]);

  const close = useCallback(() => {
    cancelPendingFocus();
    setIsOpen(false);
  }, [cancelPendingFocus]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    focusInput();
  }, [focusInput, isOpen]);

  useEffect(() => cancelPendingFocus, [cancelPendingFocus]);

  return {
    close,
    inputRef,
    isOpen,
    open,
  };
}
