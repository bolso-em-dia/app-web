import { useCallback, useMemo } from "react";
import { type CategoryOption } from "../../app/api/categories";
import { listTransactions, materializeTransactions, type Transaction, type TransactionFilters } from "../../app/api/transactions";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import Spinner from "../../components/feedback/Spinner";
import Card from "../../components/ui/Card";
import PaginationBar from "../../components/ui/PaginationBar";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";
import { useInfinitePageList } from "../../lib/useInfinitePageList";
import TransactionCard from "./TransactionCard";
import styles from "./TransactionsPage.module.scss";

interface TransactionListProps {
  categoryOptions: CategoryOption[];
  filters: TransactionFilters;
  selectedId: string | null;
  onSelect: (id: string, transaction: Transaction) => void;
  refreshKey: number;
}

export default function TransactionList({ categoryOptions, filters, selectedId, onSelect, refreshKey }: TransactionListProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const { referenceMonth, search, type: typeFilter, ownershipType: ownershipFilter, accountId, categoryIds, memberId } = filters;
  const queryKey = useMemo(() => JSON.stringify({ ...filters, refreshKey }), [filters, refreshKey]);

  const loadPageData = useCallback(
    async (page: number, size: number) => {
      if (page === 0) {
        await materializeTransactions(referenceMonth, accessToken!);
      }

      return listTransactions(
        {
          referenceMonth,
          page,
          size,
          search,
          type: typeFilter,
          ownershipType: ownershipFilter,
          accountId,
          categoryIds,
          memberId,
        },
        accessToken!,
      );
    },
    [accessToken, accountId, categoryIds, memberId, ownershipFilter, referenceMonth, search, typeFilter],
  );

  const {
    items: transactions,
    totalItems,
    isInitialLoading,
    hasLoadedOnce,
    hasNextPage,
    isLoadingMore,
    error,
    retry,
    sentinelRef,
  } = useInfinitePageList<Transaction>({
    enabled: Boolean(accessToken),
    queryKey,
    initialPageSize: DEFAULT_PAGE_SIZE,
    loadPage: loadPageData,
  });

  const categoryOptionsById = useMemo(() => new Map(categoryOptions.map((cat) => [cat.id, cat])), [categoryOptions]);
  const listError = error ? t("transactions.error") : null;

  if (isInitialLoading) {
    return (
      <Card className={styles.loadingCard}>
        <Spinner label={t("transactions.loading")} />
      </Card>
    );
  }

  if (transactions.length === 0 && hasLoadedOnce && !listError) {
    return (
      <section className={styles.transactionGrid}>
        <Card className={styles.emptyState}>
          <p>{t("transactions.empty")}</p>
        </Card>
      </section>
    );
  }

  return (
    <>
      <section className={styles.transactionGrid}>
        {transactions.map((transaction) => {
          const categoryOption = categoryOptionsById.get(transaction.categoryId);

          return (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              categoryOption={categoryOption}
              isSelected={selectedId === transaction.id}
              onSelect={(id) => onSelect(id, transaction)}
            />
          );
        })}
      </section>

      {listError ? <p>{listError}</p> : null}

      <PaginationBar
        loaded={transactions.length}
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
