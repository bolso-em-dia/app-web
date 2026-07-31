import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { isSortDirection, type SortValue } from "./sorting";

type UseSortSearchParamsParams<TSortBy extends string> = {
  defaultValue: SortValue<TSortBy>;
  validSortBy: readonly TSortBy[];
};

export function useSortSearchParams<TSortBy extends string>({ defaultValue, validSortBy }: UseSortSearchParamsParams<TSortBy>) {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = useMemo<SortValue<TSortBy>>(() => {
    const sortBy = searchParams.get("sortBy");
    const sortDir = searchParams.get("sortDir");

    if (!sortBy || !validSortBy.includes(sortBy as TSortBy) || !isSortDirection(sortDir)) {
      return defaultValue;
    }

    return {
      sortBy: sortBy as TSortBy,
      sortDir,
    };
  }, [defaultValue, searchParams, validSortBy]);

  const setValue = useCallback(
    (nextValue: SortValue<TSortBy>) => {
      const next = new URLSearchParams(searchParams);
      next.set("sortBy", nextValue.sortBy);
      next.set("sortDir", nextValue.sortDir);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return { value, setValue };
}
