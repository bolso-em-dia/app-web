import { useCallback, useEffect, useMemo, useState } from "react";
import { listAccountOptions, type AccountOption } from "../../app/api/accounts";
import { listCategoryOptions, type CategoryOption } from "../../app/api/categories";
import { listFixedExpenseTemplates, type FixedExpenseTemplate } from "../../app/api/fixedExpenses";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import Spinner from "../../components/feedback/Spinner";
import Card from "../../components/ui/Card";
import PaginationBar from "../../components/ui/PaginationBar";
import { DEFAULT_PAGE_SIZE, type StatusFilter } from "../../lib/constants";
import { useInfinitePageList } from "../../lib/useInfinitePageList";
import FixedExpenseCard from "./FixedExpenseCard";
import styles from "./FixedExpensesPage.module.scss";

type FixedExpenseListProps = {
  filters: { search: string; status: StatusFilter };
  referenceMonth: string;
  selectedId: string | null;
  onSelect: (id: string, template: FixedExpenseTemplate) => void;
  refreshKey: number;
  onAccountOptionsLoaded: (options: AccountOption[]) => void;
  onCategoryOptionsLoaded: (options: CategoryOption[]) => void;
};

export default function FixedExpenseList({
  filters,
  referenceMonth,
  selectedId,
  onSelect,
  refreshKey,
  onAccountOptionsLoaded,
  onCategoryOptionsLoaded,
}: FixedExpenseListProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(null);
  const queryKey = useMemo(() => JSON.stringify({ ...filters, referenceMonth, refreshKey }), [filters, referenceMonth, refreshKey]);

  const loadReferenceData = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setReferenceDataError(null);

    try {
      const [categoriesResponse, accountsResponse] = await Promise.all([
        listCategoryOptions(referenceMonth, accessToken),
        listAccountOptions(referenceMonth, accessToken),
      ]);

      setCategoryOptions(categoriesResponse);
      onCategoryOptionsLoaded(categoriesResponse);
      onAccountOptionsLoaded(accountsResponse);
    } catch {
      setReferenceDataError(t("fixedTransactions.error"));
    }
  }, [accessToken, onAccountOptionsLoaded, onCategoryOptionsLoaded, referenceMonth, t]);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData, refreshKey]);

  const {
    items: templates,
    totalItems,
    isInitialLoading,
    hasNextPage,
    isLoadingMore,
    error,
    retry,
    sentinelRef,
  } = useInfinitePageList<FixedExpenseTemplate>({
    enabled: Boolean(accessToken),
    queryKey,
    initialPageSize: DEFAULT_PAGE_SIZE,
    loadPage: (page, size) =>
      listFixedExpenseTemplates(
        {
          page,
          size,
          search: filters.search,
          status: filters.status,
        },
        accessToken!,
      ),
  });

  const categoryOptionsById = useMemo(() => new Map(categoryOptions.map((c) => [c.id, c])), [categoryOptions]);
  const listError = referenceDataError ?? (error ? t("fixedTransactions.error") : null);

  if (isInitialLoading) {
    return (
      <Card className={styles.loadingCard}>
        <Spinner label={t("fixedTransactions.loading")} />
      </Card>
    );
  }

  return (
    <>
      <section className={styles.templateGrid}>
        {templates.length === 0 && !listError ? (
          <Card className={styles.loadingCard}>
            <p>{t("fixedTransactions.empty")}</p>
          </Card>
        ) : (
          templates.map((template) => (
            <FixedExpenseCard
              key={template.id}
              categoryOption={categoryOptionsById.get(template.categoryId)}
              isSelected={selectedId === template.id}
              template={template}
              onSelect={(id) => onSelect(id, template)}
            />
          ))
        )}
      </section>

      {listError ? <p>{listError}</p> : null}

      <PaginationBar
        loaded={templates.length}
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
