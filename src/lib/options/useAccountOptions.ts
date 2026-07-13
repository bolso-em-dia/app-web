import { useCallback, useMemo } from "react";
import { listAccounts, type Account } from "../../app/api/accounts";
import { useAuth } from "../../app/auth/useAuth";
import type { FilterOption } from "../filterFields";
import { useCachedOptionsResource } from "./useCachedOptionsResource";

type UseAccountOptionsResult = {
  items: Account[];
  options: FilterOption<string, Account>[];
  byValue: Map<string, Account>;
  isLoading: boolean;
  error: string | null;
};

export function useAccountOptions(): UseAccountOptionsResult {
  const { accessToken } = useAuth();

  const load = useCallback(() => {
    if (!accessToken) {
      return Promise.resolve([] as Account[]);
    }

    return listAccounts(accessToken);
  }, [accessToken]);

  const { data, isLoading, error } = useCachedOptionsResource(
    accessToken ? `accounts:${accessToken}` : null,
    load,
  );

  const items = useMemo(() => data ?? [], [data]);

  const options = useMemo(
    () =>
      items.map((account) => ({
        value: account.id,
        label: account.name,
        raw: account,
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
