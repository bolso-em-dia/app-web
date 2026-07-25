import { useCallback, useEffect, useRef, useState } from "react";

export function useMobileSearchToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusRequestRef = useRef(0);

  const focusInput = useCallback(() => {
    const requestId = ++focusRequestRef.current;

    window.requestAnimationFrame(() => {
      if (requestId !== focusRequestRef.current) {
        return;
      }

      inputRef.current?.focus();
    });
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    focusInput();
  }, [focusInput]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    focusInput();
  }, [focusInput, isOpen]);

  return {
    close,
    inputRef,
    isOpen,
    open,
  };
}
