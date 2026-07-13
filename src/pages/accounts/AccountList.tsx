import { useMemo } from "react";
import { listAccountPage, type Account, type AccountType } from "../../app/api/accounts";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import Spinner from "../../components/feedback/Spinner";
import Card from "../../components/ui/Card";
import PaginationBar from "../../components/ui/PaginationBar";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";
import { useInfinitePageList } from "../../lib/useInfinitePageList";
import AccountCard from "./AccountCard";
import styles from "./AccountsPage.module.scss";

interface AccountListProps {
  filters: {
    search: string;
    status: "ALL" | "ACTIVE" | "ARCHIVED";
    type: "" | AccountType;
  };
  selectedId: string | null;
  onSelect: (id: string, account: Account) => void;
  refreshKey: number;
}

export default function AccountList({ filters, selectedId, onSelect, refreshKey }: AccountListProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const queryKey = useMemo(() => JSON.stringify({ ...filters, refreshKey }), [filters, refreshKey]);
  const {
    items: accounts,
    totalItems,
    isInitialLoading,
    hasNextPage,
    isLoadingMore,
    error,
    retry,
    sentinelRef,
  } = useInfinitePageList<Account>({
    enabled: Boolean(accessToken),
    queryKey,
    initialPageSize: DEFAULT_PAGE_SIZE,
    loadPage: (page, size) =>
      listAccountPage(
        {
          page,
          size,
          search: filters.search,
          status: filters.status,
          type: filters.type || undefined,
        },
        accessToken!,
      ),
  });
  const listError = error ? t("accounts.error") : null;

  if (isInitialLoading) {
    return (
      <Card className={styles.loadingCard}>
        <Spinner label={t("accounts.loading")} />
      </Card>
    );
  }

  return (
    <>
      {accounts.length === 0 && !listError ? (
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

      {listError ? <p>{listError}</p> : null}

      <PaginationBar
        loaded={accounts.length}
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
