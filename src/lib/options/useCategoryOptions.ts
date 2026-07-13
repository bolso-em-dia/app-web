import { useCallback, useMemo } from "react";
import {
  listCategoryOptions,
  type CategoryOption,
} from "../../app/api/categories";
import { useAuth } from "../../app/auth/useAuth";
import type { FilterOption } from "../filterFields";
import { useCachedOptionsResource } from "./useCachedOptionsResource";

type UseCategoryOptionsResult = {
  items: CategoryOption[];
  options: FilterOption<string, CategoryOption>[];
  byValue: Map<string, CategoryOption>;
  isLoading: boolean;
  error: string | null;
};

export function useCategoryOptions(
  referenceMonth: string,
): UseCategoryOptionsResult {
  const { accessToken } = useAuth();

  const load = useCallback(() => {
    if (!accessToken) {
      return Promise.resolve([] as CategoryOption[]);
    }

    return listCategoryOptions(referenceMonth, accessToken);
  }, [accessToken, referenceMonth]);

  const { data, isLoading, error } = useCachedOptionsResource(
    accessToken ? `categories:${referenceMonth}:${accessToken}` : null,
    load,
  );

  const items = useMemo(() => data ?? [], [data]);

  const options = useMemo(
    () =>
      items.map((category) => ({
        value: category.id,
        label: category.name,
        raw: category,
      })),
    [items],
  );

  const byValue = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  return {
    items,
    options,
    byValue,
    isLoading,
    error,
  };
}
