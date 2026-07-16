import { useCallback, useEffect, useMemo, useState } from "react";
import { listBudgets, type Budget, type BudgetType } from "../../app/api/budgets";
import { listCategoryOptions, type CategoryOption } from "../../app/api/categories";
import { listFamilyMembers, type FamilyMember } from "../../app/api/family";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import Spinner from "../../components/feedback/Spinner";
import Card from "../../components/ui/Card";
import PaginationBar from "../../components/ui/PaginationBar";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";
import { useInfinitePageList } from "../../lib/useInfinitePageList";
import BudgetCard from "./BudgetCard";
import styles from "./BudgetsPage.module.scss";

interface BudgetListProps {
  filters: {
    search: string;
    status: "ALL" | "ACTIVE" | "ARCHIVED";
    type: BudgetType | "ALL";
    referenceMonth: string;
  };
  selectedId: string | null;
  onSelect: (id: string, budget: Budget) => void;
  refreshKey: number;
  onReferenceDataLoaded: (data: { categories: CategoryOption[]; members: FamilyMember[]; allowanceBudgets: Budget[] }) => void;
}

export default function BudgetList({ filters, selectedId, onSelect, refreshKey, onReferenceDataLoaded }: BudgetListProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [referenceDataError, setReferenceDataError] = useState<string | null>(null);
  const queryKey = useMemo(() => JSON.stringify({ ...filters, refreshKey }), [filters, refreshKey]);

  const loadReferenceData = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setReferenceDataError(null);

    try {
      const [categories, members, allowanceBudgets] = await Promise.all([
        listCategoryOptions(filters.referenceMonth, accessToken),
        listFamilyMembers(accessToken),
        listBudgets(
          {
            referenceMonth: filters.referenceMonth,
            page: 0,
            size: 200,
            status: "ACTIVE",
            type: "ALLOWANCE",
          },
          accessToken,
        ).then((response) => response.items),
      ]);

      onReferenceDataLoaded({ categories, members, allowanceBudgets });
    } catch (loadError) {
      console.error("Failed to load budget reference data.", loadError);
      setReferenceDataError(t("budgets.error"));
    }
  }, [accessToken, filters.referenceMonth, onReferenceDataLoaded, t]);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData, refreshKey]);

  const {
    items: budgets,
    totalItems,
    isInitialLoading,
    hasNextPage,
    isLoadingMore,
    error,
    retry,
    sentinelRef,
  } = useInfinitePageList<Budget>({
    enabled: Boolean(accessToken),
    queryKey,
    initialPageSize: DEFAULT_PAGE_SIZE,
    loadPage: (page, size) =>
      listBudgets(
        {
          referenceMonth: filters.referenceMonth,
          page,
          size,
          search: filters.search || undefined,
          status: filters.status,
          type: filters.type === "ALL" ? undefined : filters.type,
        },
        accessToken!,
      ),
  });

  const listError = referenceDataError ?? (error ? t("budgets.error") : null);

  if (isInitialLoading) {
    return (
      <Card className={styles.loadingCard}>
        <Spinner label={t("budgets.loading")} />
      </Card>
    );
  }

  if (budgets.length === 0 && !listError) {
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
          <BudgetCard key={budget.id} budget={budget} isSelected={selectedId === budget.id} onSelect={() => onSelect(budget.id, budget)} />
        ))}
      </section>

      {listError ? <p>{listError}</p> : null}

      <PaginationBar
        loaded={budgets.length}
        total={totalItems}
        isLoadingMore={isLoadingMore}
        hasNextPage={hasNextPage}
        error={listError}
        onRetry={retry}
        sentinelRef={sentinelRef}
      />
    </>
  );
}
