import { useCallback, useEffect, useState } from "react";
import {
  listCategories,
  listCategoryOptions,
  type Category,
  type CategoryOption,
} from "../../app/api/categories";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import Card from "../../components/ui/Card";
import PaginationBar from "../../components/ui/PaginationBar";
import { getCurrentReferenceMonth } from "../../lib/formatters/date";
import { DEFAULT_PAGE_SIZE, type StatusFilter } from "../../lib/constants";
import { usePagination } from "../../lib/usePagination";
import { useI18n } from "../../app/i18n/I18nContext";
import CategoryCard from "./CategoryCard";
import styles from "./CategoriesPage.module.scss";

interface CategoryListProps {
  search: string;
  statusFilter: StatusFilter;
  selectedId: string | null;
  onSelect: (id: string, category: Category) => void;
  refreshKey: number;
  onOptionsLoaded: (options: CategoryOption[]) => void;
}

export default function CategoryList({
  search,
  statusFilter,
  selectedId,
  onSelect,
  refreshKey,
  onOptionsLoaded,
}: CategoryListProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();

  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(
    async (p: number, s: number) => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [categoriesResponse, optionsResponse] = await Promise.all([
          listCategories(
            { page: p, size: s, search, status: statusFilter },
            accessToken,
          ),
          listCategoryOptions(getCurrentReferenceMonth(), accessToken),
        ]);

        setCategories(categoriesResponse.items);
        setPage(categoriesResponse.page);
        setPageSize(categoriesResponse.size);
        setTotalItems(categoriesResponse.totalItems);
        onOptionsLoaded(optionsResponse);
      } catch {
        setError(t("categories.error"));
      } finally {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [accessToken, t, onOptionsLoaded, search, statusFilter],
  );

  useEffect(() => {
    setPage(0);
    void loadCategories(0, pageSize);
  }, [loadCategories, search, statusFilter, pageSize, refreshKey]);

  const handlePreviousPage = () => {
    const p = page - 1;
    setPage(p);
    void loadCategories(p, pageSize);
  };

  const handleNextPage = () => {
    const p = page + 1;
    setPage(p);
    void loadCategories(p, pageSize);
  };

  const handlePageSizeChange = (s: number) => {
    setPageSize(s);
    setPage(0);
    void loadCategories(0, s);
  };

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const pagination = usePagination(page, pageSize, totalItems, totalPages);

  if (showInitialLoading) {
    return (
      <Card className={styles.loadingCard}>
        <Spinner label={t("categories.loading")} />
      </Card>
    );
  }

  return (
    <>
      {categories.length === 0 ? (
        <section className={styles.categoryGrid}>
          <Card className={styles.emptyState}>
            <p>{t("categories.empty")}</p>
          </Card>
        </section>
      ) : (
        <section className={styles.categoryGrid}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={selectedId === category.id}
              onSelect={(id) => onSelect(id, category)}
            />
          ))}
        </section>
      )}

      {error ? <p>{error}</p> : null}

      <PaginationBar
        start={pagination.rangeStart}
        end={pagination.rangeEnd}
        total={totalItems}
        pageSize={pageSize}
        hasPrevious={pagination.hasPreviousPage}
        hasNext={pagination.hasNextPage}
        onPrevious={handlePreviousPage}
        onNext={handleNextPage}
        onPageSizeChange={handlePageSizeChange}
        showPageIndicator
        page={totalPages === 0 ? 0 : page + 1}
        totalPages={totalPages}
      />
    </>
  );
}
