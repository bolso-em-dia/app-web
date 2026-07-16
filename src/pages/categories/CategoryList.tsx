import { useCallback, useEffect, useMemo, useState } from "react";
import { listCategories, listCategoryOptions, type Category, type CategoryOption } from "../../app/api/categories";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import Spinner from "../../components/feedback/Spinner";
import Card from "../../components/ui/Card";
import PaginationBar from "../../components/ui/PaginationBar";
import { DEFAULT_PAGE_SIZE, type StatusFilter } from "../../lib/constants";
import { getCurrentReferenceMonth } from "../../lib/formatters/date";
import { useInfinitePageList } from "../../lib/useInfinitePageList";
import CategoryCard from "./CategoryCard";
import styles from "./CategoriesPage.module.scss";

interface CategoryListProps {
  filters: { search: string; status: StatusFilter };
  selectedId: string | null;
  onSelect: (id: string, category: Category) => void;
  refreshKey: number;
  onOptionsLoaded: (options: CategoryOption[]) => void;
}

export default function CategoryList({ filters, selectedId, onSelect, refreshKey, onOptionsLoaded }: CategoryListProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const queryKey = useMemo(() => JSON.stringify({ ...filters, refreshKey }), [filters, refreshKey]);

  const loadOptions = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setOptionsError(null);

    try {
      const optionsResponse = await listCategoryOptions(getCurrentReferenceMonth(), accessToken);
      onOptionsLoaded(optionsResponse);
    } catch (loadError) {
      console.error("Failed to load category options.", loadError);
      setOptionsError(t("categories.error"));
    }
  }, [accessToken, onOptionsLoaded, t]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions, refreshKey]);

  const {
    items: categories,
    totalItems,
    isInitialLoading,
    hasNextPage,
    isLoadingMore,
    error,
    retry,
    sentinelRef,
  } = useInfinitePageList<Category>({
    enabled: Boolean(accessToken),
    queryKey,
    initialPageSize: DEFAULT_PAGE_SIZE,
    loadPage: (page, size) =>
      listCategories(
        {
          page,
          size,
          search: filters.search,
          status: filters.status,
        },
        accessToken!,
      ),
  });

  const listError = optionsError ?? (error ? t("categories.error") : null);

  if (isInitialLoading) {
    return (
      <Card className={styles.loadingCard}>
        <Spinner label={t("categories.loading")} />
      </Card>
    );
  }

  return (
    <>
      {categories.length === 0 && !listError ? (
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

      {listError ? <p>{listError}</p> : null}

      <PaginationBar
        loaded={categories.length}
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
