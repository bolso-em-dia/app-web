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
};

export const operationalNavigation: NavigationItem[] = [
  {
    labelKey: "navigation.dashboard",
    path: "/dashboard",
  },
  {
    labelKey: "navigation.envelopes",
    path: "/envelopes",
  },
  {
    labelKey: "navigation.fixedExpenses",
    path: "/fixed-expenses",
  },
  {
    labelKey: "navigation.transactions",
    path: "/transactions",
  },
];

export const managementNavigation: NavigationItem[] = [
  {
    labelKey: "navigation.family",
    path: "/family",
  },
  {
    labelKey: "navigation.categories",
    path: "/categories",
  },
  {
    labelKey: "navigation.accounts",
    path: "/accounts",
  },
];
