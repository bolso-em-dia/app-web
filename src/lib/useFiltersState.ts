import { useCallback, useState } from "react";

export function useFiltersState<T extends Record<string, unknown>>(defaults: T) {
  const [filters, setFilters] = useState<T>(defaults);

  const patchFilters = useCallback((partial: Partial<T>) => {
    setFilters((current) => ({ ...current, ...partial }));
  }, []);

  const clearFilter = useCallback(<K extends keyof T>(key: K, emptyValue: T[K]) => {
    setFilters((current) => ({ ...current, [key]: emptyValue }));
  }, []);

  const resetFilters = useCallback(
    (nextDefaults?: T) => {
      setFilters(nextDefaults ?? defaults);
    },
    [defaults],
  );

  return { filters, patchFilters, clearFilter, resetFilters, setFilters };
}
