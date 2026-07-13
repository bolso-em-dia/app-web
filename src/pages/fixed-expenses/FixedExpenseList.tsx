import { useCallback, useEffect, useMemo, useState } from "react";
import type { FixedExpenseTemplate } from "../../app/api/fixedExpenses";
import { listFixedExpenseTemplates } from "../../app/api/fixedExpenses";
import {
  listCategoryOptions,
  type CategoryOption,
} from "../../app/api/categories";
import { listAccountOptions, type AccountOption } from "../../app/api/accounts";
import type { StatusFilter } from "../../lib/constants";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";
import type { TransactionType } from "../../app/api/transactions";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import { usePagination } from "../../lib/usePagination";
import Spinner from "../../components/feedback/Spinner";
import Card from "../../components/ui/Card";
import PaginationBar from "../../components/ui/PaginationBar";
import FixedExpenseCard from "./FixedExpenseCard";
import styles from "./FixedExpensesPage.module.scss";

type FixedExpenseListProps = {
  search: string;
  statusFilter: StatusFilter;
  typeFilter: TransactionType | "ALL";
  referenceMonth: string;
  selectedId: string | null;
  onSelect: (id: string, template: FixedExpenseTemplate) => void;
  refreshKey: number;
  onAccountOptionsLoaded: (options: AccountOption[]) => void;
  onCategoryOptionsLoaded: (options: CategoryOption[]) => void;
};

export default function FixedExpenseList({
  search,
  statusFilter,
  typeFilter,
  referenceMonth,
  selectedId,
  onSelect,
  refreshKey,
  onAccountOptionsLoaded,
  onCategoryOptionsLoaded,
}: FixedExpenseListProps) {
  void typeFilter;
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [templates, setTemplates] = useState<FixedExpenseTemplate[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  const loadData = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);

    try {
      const [templatesResponse, categoriesResponse, accountsResponse] =
        await Promise.all([
          listFixedExpenseTemplates(
            { page, size: pageSize, search, status: statusFilter },
            accessToken,
          ),
          listCategoryOptions(referenceMonth, accessToken),
          listAccountOptions(referenceMonth, accessToken),
        ]);

      setTemplates(templatesResponse.items);
      setPage(templatesResponse.page);
      setPageSize(templatesResponse.size);
      setTotalItems(templatesResponse.totalItems);
      setCategoryOptions(categoriesResponse);
      onCategoryOptionsLoaded(categoriesResponse);
      onAccountOptionsLoaded(accountsResponse);
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  }, [
    accessToken,
    page,
    pageSize,
    search,
    statusFilter,
    referenceMonth,
    onAccountOptionsLoaded,
    onCategoryOptionsLoaded,
  ]);

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, pageSize]);

  useEffect(() => {
    void loadData();
  }, [loadData, refreshKey]);

  const categoryOptionsById = useMemo(
    () => new Map(categoryOptions.map((c) => [c.id, c])),
    [categoryOptions],
  );

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const pagination = usePagination(page, pageSize, totalItems, totalPages);

  if (showInitialLoading) {
    return (
      <Card className={styles.loadingCard}>
        <Spinner label={t("fixedTransactions.loading")} />
      </Card>
    );
  }

  return (
    <>
      <section className={styles.templateGrid}>
        {templates.length === 0 ? (
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
        showPageIndicator
        page={totalPages === 0 ? 0 : page + 1}
        totalPages={totalPages}
      />
    </>
  );
}
