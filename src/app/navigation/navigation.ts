export type NavigationItem = {
  label: string;
  path: string;
  description: string;
};

export const primaryNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    description: "Monthly overview",
  },
];

export const managementNavigation: NavigationItem[] = [
  {
    label: "Family",
    path: "/family",
    description: "Members and roles",
  },
  {
    label: "Categories",
    path: "/categories",
    description: "Expense classification",
  },
  {
    label: "Accounts",
    path: "/accounts",
    description: "Cash and cards",
  },
  {
    label: "Envelopes",
    path: "/envelopes",
    description: "Budgets and allowance",
  },
  {
    label: "Fixed expenses",
    path: "/fixed-expenses",
    description: "Recurring entries",
  },
  {
    label: "Transactions",
    path: "/transactions",
    description: "Monthly activity",
  },
];
