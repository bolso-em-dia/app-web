import { useCallback, useEffect, useRef, useState } from "react";
import {
  listAccountPage,
  type Account,
  type AccountListParams,
  type AccountType,
} from "../../app/api/accounts";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import Card from "../../components/ui/Card";
import PaginationBar from "../../components/ui/PaginationBar";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";
import { useI18n } from "../../app/i18n/I18nContext";
import { usePagination } from "../../lib/usePagination";
import AccountCard from "./AccountCard";
import styles from "./AccountsPage.module.scss";

interface AccountListProps {
  filters: { search: string; status: "ALL" | "ACTIVE" | "ARCHIVED"; type: "" | AccountType };
  selectedId: string | null;
  onSelect: (id: string, account: Account) => void;
  refreshKey: number;
}

export default function AccountList({
  filters,
  selectedId,
  onSelect,
  refreshKey,
}: AccountListProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const loadAccounts = useCallback(
    async (params: AccountListParams) => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await listAccountPage(params, accessToken);
        setAccounts(response.items);
        setPage(response.page);
        setPageSize(response.size);
        setTotalItems(response.totalItems);
      } catch {
        setAccounts([]);
      } finally {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [accessToken],
  );

  const prevFiltersRef = useRef("");
  useEffect(() => {
    const filterKey = JSON.stringify({
      search: filters.search,
      status: filters.status,
      type: filters.type,
    });
    if (prevFiltersRef.current !== filterKey) {
      prevFiltersRef.current = filterKey;
      setPage(0);
    }
  }, [filters.search, filters.status, filters.type]);

  useEffect(() => {
    void loadAccounts({
      page,
      size: pageSize,
      search: filters.search,
      status: filters.status,
      type: filters.type || undefined,
    });
  }, [
    loadAccounts,
    page,
    pageSize,
    filters.search,
    filters.status,
    filters.type,
    refreshKey,
  ]);

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const pagination = usePagination(page, pageSize, totalItems, totalPages);

  if (showInitialLoading) {
    return (
      <Card className={styles.loadingCard}>
        <Spinner label={t("accounts.loading")} />
      </Card>
    );
  }

  return (
    <>
      {accounts.length === 0 ? (
        <section className={styles.accountGrid}>
          <Card className={styles.emptyState}>
            <p>{t("accounts.empty")}</p>
          </Card>
        </section>
      ) : (
        <section className={styles.accountGrid}>
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              isSelected={selectedId === account.id}
              onSelect={(id) => onSelect(id, account)}
            />
          ))}
        </section>
      )}

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
