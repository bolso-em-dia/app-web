import { apiRequest } from "./client";

type DashboardSummary = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  availableBalance: number;
  reservedBudgetAmount: number;
};

type DashboardTransaction = {
  id: string;
  type: string;
  ownershipType: string;
  sourceType: string;
  description: string;
  amount: number;
  convertedAmount: number;
  exchangeRate?: number | null;
  currency: string;
  transactionDate: string;
  referenceMonth: string;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  memberId: string | null;
  memberName: string | null;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  fixedExpenseTemplateId?: string | null;
  projected?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

type DashboardBudget = {
  id: string;
  name: string;
  type: string;
  ownerMemberId: string | null;
  ownerMemberName: string | null;
  monthlyLimit: number;
  consumedAmount: number;
  remainingAmount: number;
  createdInMonth: string;
  archivedFromMonth: string | null;
  active: boolean;
  categories: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
  transactions: DashboardTransaction[];
};

type DashboardCategoryBreakdown = {
  categoryId: string;
  categoryName: string;
  amount: number;
};

export type DashboardResponse = {
  referenceMonth: string;
  summary: DashboardSummary;
  budgets: DashboardBudget[];
  recentTransactions: DashboardTransaction[];
  categoryBreakdown: DashboardCategoryBreakdown[];
};

export function getDashboard(referenceMonth: string, accessToken: string) {
  return apiRequest<DashboardResponse>(
    `/api/dashboard?referenceMonth=${referenceMonth}`,
    {
      method: "GET",
      accessToken,
    },
  );
}
