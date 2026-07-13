import { useCallback, useMemo } from "react";
import { listFamilyMembers, type FamilyMember } from "../../app/api/family";
import { useAuth } from "../../app/auth/useAuth";
import type { FilterOption } from "../filterFields";
import { useCachedOptionsResource } from "./useCachedOptionsResource";

type UseFamilyMemberOptionsParams = {
  allowanceEnabledOnly?: boolean;
};

type UseFamilyMemberOptionsResult = {
  items: FamilyMember[];
  options: FilterOption<string, FamilyMember>[];
  byValue: Map<string, FamilyMember>;
  isLoading: boolean;
  error: string | null;
};

export function useFamilyMemberOptions({
  allowanceEnabledOnly = false,
}: UseFamilyMemberOptionsParams = {}): UseFamilyMemberOptionsResult {
  const { accessToken } = useAuth();

  const load = useCallback(() => {
    if (!accessToken) {
      return Promise.resolve([] as FamilyMember[]);
    }

    return listFamilyMembers(accessToken);
  }, [accessToken]);

  const { data, isLoading, error } = useCachedOptionsResource(
    accessToken ? `family-members:${accessToken}` : null,
    load,
  );

  const allItems = useMemo(() => data ?? [], [data]);

  const items = useMemo(
    () =>
      allowanceEnabledOnly
        ? allItems.filter((member) => member.active && member.allowanceEnabled)
        : allItems,
    [allItems, allowanceEnabledOnly],
  );

  const options = useMemo(
    () =>
      items.map((member) => ({
        value: member.id,
        label: member.name,
        raw: member,
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
