import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

export function useFilterController<T extends Record<string, unknown>>(
  filters: T,
  onChange: Dispatch<SetStateAction<T>>,
) {
  const patch = useCallback(
    (partial: Partial<T>) => {
      onChange((current) => ({ ...current, ...partial }));
    },
    [onChange],
  );

  const set = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      onChange((current) => ({ ...current, [key]: value }));
    },
    [onChange],
  );

  const clear = useCallback(
    <K extends keyof T>(key: K, emptyValue: T[K]) => {
      onChange((current) => ({ ...current, [key]: emptyValue }));
    },
    [onChange],
  );

  const reset = useCallback(
    (nextValue: T | ((current: T) => T)) => {
      onChange(nextValue);
    },
    [onChange],
  );

  return {
    filters,
    patch,
    set,
    clear,
    reset,
  };
}
