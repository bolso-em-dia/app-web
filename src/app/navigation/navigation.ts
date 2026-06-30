import type { NavigationIconId } from "../../lib/icons";

export type NavigationItem = {
  labelKey:
    | "navigation.dashboard"
    | "navigation.envelopes"
    | "navigation.fixedExpenses"
    | "navigation.transactions"
    | "navigation.family"
    | "navigation.categories"
    | "navigation.accounts";
  path: string;
  iconId: NavigationIconId;
};

export const operationalNavigation: NavigationItem[] = [
  {
    labelKey: "navigation.dashboard",
    path: "/dashboard",
    iconId: "dashboard",
  },
  {
    labelKey: "navigation.envelopes",
    path: "/envelopes",
    iconId: "envelopes",
  },
  {
    labelKey: "navigation.fixedExpenses",
    path: "/fixed-expenses",
    iconId: "fixed-expenses",
  },
  {
    labelKey: "navigation.transactions",
    path: "/transactions",
    iconId: "transactions",
  },
];

export const managementNavigation: NavigationItem[] = [
  {
    labelKey: "navigation.family",
    path: "/family",
    iconId: "family",
  },
  {
    labelKey: "navigation.categories",
    path: "/categories",
    iconId: "categories",
  },
  {
    labelKey: "navigation.accounts",
    path: "/accounts",
    iconId: "accounts",
  },
];
