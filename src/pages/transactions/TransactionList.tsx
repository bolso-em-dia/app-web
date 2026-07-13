import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../app/auth/useAuth";
import { listAccounts, type Account } from "../../app/api/accounts";
import {
  listCategoryOptions,
  type CategoryOption,
} from "../../app/api/categories";
import { listFamilyMembers, type FamilyMember } from "../../app/api/family";
import {
  listTransactions,
  materializeTransactions,
  type Transaction,
  type TransactionFilters,
} from "../../app/api/transactions";
import Spinner from "../../components/feedback/Spinner";
import Card from "../../components/ui/Card";
import PaginationBar from "../../components/ui/PaginationBar";
import { useI18n } from "../../app/i18n/I18nContext";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";
import { usePagination } from "../../lib/usePagination";
import TransactionCard from "./TransactionCard";
import styles from "./TransactionsPage.module.scss";

interface TransactionListProps {
  filters: TransactionFilters;
  selectedId: string | null;
  onSelect: (id: string, transaction: Transaction) => void;
  refreshKey: number;
  onReferenceDataLoaded: (data: {
    accounts: Account[];
    categories: CategoryOption[];
    members: FamilyMember[];
  }) => void;
}

export default function TransactionList({
  filters,
  selectedId,
  onSelect,
  refreshKey,
  onReferenceDataLoaded,
}: TransactionListProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const loadCounterRef = useRef(0);
  const onReferenceDataLoadedRef = useRef(onReferenceDataLoaded);
  onReferenceDataLoadedRef.current = onReferenceDataLoaded;

    const {
      referenceMonth,
      search,
      type: typeFilter,
      ownershipType: ownershipFilter,
      accountId,
      categoryIds,
      memberId,
    } = filters;

  const filterKey = useMemo(
    () => JSON.stringify(filters),
    [filters],
  );

  useEffect(() => {
    setPage(0);
  }, [filterKey]);

  const loadPageData = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    const loadId = ++loadCounterRef.current;
    setIsLoading(true);

    try {
      await materializeTransactions(referenceMonth, accessToken);

      const params: Record<string, unknown> = {
        referenceMonth,
        page,
        size: pageSize,
      };
      if (search) params.search = search;
      if (typeFilter && typeFilter !== "ALL") params.type = typeFilter;
      if (ownershipFilter && ownershipFilter !== "ALL")
        params.ownershipType = ownershipFilter;
      if (accountId) params.accountId = accountId;
      if (categoryIds && categoryIds.length > 0)
        params.categoryIds = categoryIds;
      if (memberId) params.memberId = memberId;

      const [
        transactionsResponse,
        accountsResponse,
        categoriesResponse,
        membersResponse,
      ] = await Promise.all([
        listTransactions(
          params as Parameters<typeof listTransactions>[0],
          accessToken,
        ),
        listAccounts(accessToken),
        listCategoryOptions(referenceMonth, accessToken),
        listFamilyMembers(accessToken),
      ]);

      if (loadId !== loadCounterRef.current) return;

      setTransactions(transactionsResponse.items);
      setPage(transactionsResponse.page);
      setPageSize(transactionsResponse.size);
      setTotalItems(transactionsResponse.totalItems);
      setCategories(categoriesResponse);
      onReferenceDataLoadedRef.current({
        accounts: accountsResponse,
        categories: categoriesResponse,
        members: membersResponse,
      });
    } catch {
      if (loadId === loadCounterRef.current) {
        setTransactions([]);
        setTotalItems(0);
      }
    } finally {
      if (loadId === loadCounterRef.current) {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    }
  }, [
    accessToken,
    page,
    pageSize,
    referenceMonth,
    search,
    typeFilter,
    ownershipFilter,
    accountId,
    categoryIds,
    memberId,
  ]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData, refreshKey]);

  const categoryOptionsById = useMemo(
    () => new Map(categories.map((cat) => [cat.id, cat])),
    [categories],
  );

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const pagination = usePagination(page, pageSize, totalItems, totalPages);

  if (showInitialLoading) {
    return (
      <Card className={styles.loadingCard}>
        <Spinner label={t("transactions.loading")} />
      </Card>
    );
  }

  if (transactions.length === 0 && !isLoading) {
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
        {isLoading && hasLoadedOnce ? (
          <Card className={styles.loadingCard}>
            <Spinner label={t("transactions.loading")} />
          </Card>
        ) : (
          transactions.map((transaction) => {
            const categoryOption = categoryOptionsById.get(
              transaction.categoryId,
            );
            return (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                categoryOption={categoryOption}
                isSelected={selectedId === transaction.id}
                onSelect={(id) => onSelect(id, transaction)}
              />
            );
          })
        )}
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
