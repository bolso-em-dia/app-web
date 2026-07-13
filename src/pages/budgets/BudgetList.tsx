import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import {
  listCategoryOptions,
  type CategoryOption,
} from "../../app/api/categories";
import { listFamilyMembers, type FamilyMember } from "../../app/api/family";
import {
  listBudgets,
  type Budget,
  type BudgetType,
} from "../../app/api/budgets";
import Spinner from "../../components/feedback/Spinner";
import Card from "../../components/ui/Card";
import PaginationBar from "../../components/ui/PaginationBar";
import BudgetCard from "./BudgetCard";
import { DEFAULT_PAGE_SIZE, type StatusFilter } from "../../lib/constants";
import { usePagination } from "../../lib/usePagination";
import styles from "./BudgetsPage.module.scss";

interface BudgetListProps {
  search: string;
  statusFilter: StatusFilter;
  typeFilter: BudgetType | "ALL";
  referenceMonth: string;
  selectedId: string | null;
  onSelect: (id: string, budget: Budget) => void;
  refreshKey: number;
  onReferenceDataLoaded: (data: {
    categories: CategoryOption[];
    members: FamilyMember[];
  }) => void;
}

export default function BudgetList({
  search,
  statusFilter,
  typeFilter,
  referenceMonth,
  selectedId,
  onSelect,
  refreshKey,
  onReferenceDataLoaded,
}: BudgetListProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const loadBudgetsData = useCallback(
    async (currentPage: number, currentPageSize: number) => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);

      try {
        const [budgetsResponse, categoryOptionsResponse, membersResponse] =
          await Promise.all([
            listBudgets(
              {
                referenceMonth,
                page: currentPage,
                size: currentPageSize,
                search: search || undefined,
                status: statusFilter,
                type: typeFilter === "ALL" ? undefined : typeFilter,
              },
              accessToken,
            ),
            listCategoryOptions(referenceMonth, accessToken),
            listFamilyMembers(accessToken),
          ]);

        setBudgets(budgetsResponse.items);
        setPage(budgetsResponse.page);
        setPageSize(budgetsResponse.size);
        setTotalItems(budgetsResponse.totalItems);
        onReferenceDataLoaded({
          categories: categoryOptionsResponse,
          members: membersResponse,
        });
      } catch {
        // error is handled by the loading state; list still renders with empty data
      } finally {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [
      accessToken,
      referenceMonth,
      search,
      statusFilter,
      typeFilter,
      onReferenceDataLoaded,
    ],
  );

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, typeFilter, referenceMonth]);

  useEffect(() => {
    void loadBudgetsData(page, pageSize);
  }, [loadBudgetsData, page, pageSize, refreshKey]);

  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const showInitialLoading = isLoading && !hasLoadedOnce;
  const pagination = usePagination(page, pageSize, totalItems, totalPages);

  if (showInitialLoading) {
    return (
      <Card className={styles.loadingCard}>
        <Spinner label={t("budgets.loading")} />
      </Card>
    );
  }

  if (budgets.length === 0) {
    return (
      <section className={styles.budgetGrid}>
        <Card className={styles.emptyState}>
          <p>{t("budgets.empty")}</p>
        </Card>
      </section>
    );
  }

  return (
    <>
      <section className={styles.budgetGrid}>
        {budgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            isSelected={selectedId === budget.id}
            onSelect={() => onSelect(budget.id, budget)}
          />
        ))}
      </section>

      <PaginationBar
        start={pagination.rangeStart}
        end={pagination.rangeEnd}
        total={totalItems}
        pageSize={pageSize}
        hasPrevious={pagination.hasPreviousPage}
        hasNext={pagination.hasNextPage}
        onPrevious={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(0);
        }}
      />
    </>
  );
}
