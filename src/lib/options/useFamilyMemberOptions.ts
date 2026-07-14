import { useCallback, useMemo } from "react";
import { listBudgets } from "../../app/api/budgets";
import { listFamilyMembers, type FamilyMember } from "../../app/api/family";
import { useAuth } from "../../app/auth/useAuth";
import type { FilterOption } from "../filterFields";
import { useCachedOptionsResource } from "./useCachedOptionsResource";

type UseFamilyMemberOptionsParams = {
  allowanceOnly?: boolean;
  referenceMonth?: string;
};

type UseFamilyMemberOptionsResult = {
  items: FamilyMember[];
  options: FilterOption<string, FamilyMember>[];
  byValue: Map<string, FamilyMember>;
  isLoading: boolean;
  error: string | null;
};

export function useFamilyMemberOptions({
  allowanceOnly = false,
  referenceMonth,
}: UseFamilyMemberOptionsParams = {}): UseFamilyMemberOptionsResult {
  const { accessToken } = useAuth();

  const load = useCallback(() => {
    if (!accessToken) {
      return Promise.resolve([] as FamilyMember[]);
    }

    if (!allowanceOnly || !referenceMonth) {
      return listFamilyMembers(accessToken);
    }

    return Promise.all([
      listFamilyMembers(accessToken),
      listBudgets(
        {
          referenceMonth,
          page: 0,
          size: 200,
          status: "ACTIVE",
          type: "ALLOWANCE",
        },
        accessToken,
      ),
    ]).then(([members, response]) => {
      const eligibleOwnerIds = new Set(
        response.items.map((budget) => budget.ownerMemberId).filter((memberId): memberId is string => Boolean(memberId)),
      );
      return members.filter((member) => member.active && eligibleOwnerIds.has(member.id));
    });
  }, [accessToken, allowanceOnly, referenceMonth]);

  const { data, isLoading, error } = useCachedOptionsResource(
    accessToken ? `family-members:${accessToken}:${allowanceOnly ? (referenceMonth ?? "no-month") : "all"}` : null,
    load,
  );

  const allItems = useMemo(() => data ?? [], [data]);

  const options = useMemo(
    () =>
      allItems.map((member) => ({
        value: member.id,
        label: member.name,
        raw: member,
      })),
    [allItems],
  );

  const byValue = useMemo(() => new Map(allItems.map((item) => [item.id, item])), [allItems]);

  return {
    items: allItems,
    options,
    byValue,
    isLoading,
    error,
  };
}
