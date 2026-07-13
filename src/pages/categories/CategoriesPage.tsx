import { useMemo, useState } from "react";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import FilterToolbar from "../../components/ui/FilterToolbar";
import FilterSelectInput from "../../components/ui/filterFields/FilterSelectInput";
import FilterTextInput from "../../components/ui/filterFields/FilterTextInput";
import type { Category, CategoryOption } from "../../app/api/categories";
import { useI18n } from "../../app/i18n/I18nContext";
import { ACTIVE_STATUS_FILTER, type StatusFilter } from "../../lib/constants";
import type { FilterFields } from "../../lib/filterFields";
import { useFiltersState } from "../../lib/useFiltersState";
import CategoryList from "./CategoryList";
import CategoryForm from "./CategoryForm";
import styles from "./CategoriesPage.module.scss";

type CategoryFilters = { search: string; status: StatusFilter };
const DEFAULT_FILTERS: CategoryFilters = {
  search: "",
  status: ACTIVE_STATUS_FILTER,
};

export default function CategoriesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { filters, patchFilters, clearFilter } = useFiltersState(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  const fields = useMemo<FilterFields>(
    () => ({
      search: {
        kind: "text",
        label: t("common.search"),
        value: filters.search,
        defaultValue: "",
        placement: "visible",
        element: (
          <FilterTextInput
            id="category-search"
            label={t("common.search")}
            onChange={(search) => {
              patchFilters({ search });
            }}
            placeholder={t("categories.searchPlaceholder")}
            value={filters.search}
          />
        ),
      },
      status: {
        kind: "select",
        label: t("common.status"),
        value: filters.status,
        defaultValue: ACTIVE_STATUS_FILTER,
        placement: "expanded",
        options: [
          { value: "ALL", label: t("common.all") },
          { value: "ACTIVE", label: t("common.active") },
          { value: "ARCHIVED", label: t("common.archived") },
        ],
        element: (
          <FilterSelectInput<StatusFilter>
            id="category-status-filter"
            label={t("common.status")}
            onChange={(status) => {
              patchFilters({ status: status as StatusFilter });
            }}
            options={[
              { value: "ALL", label: t("common.all") },
              { value: "ACTIVE", label: t("common.active") },
              { value: "ARCHIVED", label: t("common.archived") },
            ]}
            placeholder={t("common.all")}
            value={filters.status}
          />
        ),
      },
    }),
    [filters.search, filters.status, patchFilters, t],
  );

  function handleSelect(_id: string, category: Category) {
    setSelectedId(category.id);
    setSelectedCategory(category);
    setShowDrawer(true);
  }

  function handleStartCreate() {
    setSelectedId(null);
    setSelectedCategory(null);
    setShowDrawer(true);
  }

  function handleCloseDrawer() {
    setSelectedId(null);
    setSelectedCategory(null);
    setShowDrawer(false);
  }

  function handleSuccess() {
    setRefreshKey((k) => k + 1);
    setSelectedId(null);
    setSelectedCategory(null);
    setShowDrawer(false);
  }

  const isCreating = selectedId === null;
  const isDrawerOpen = showDrawer;

  return (
    <AppShell
      title={t("categories.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("categories.new")}
        </Button>
      }
    >
      <section className={styles.stack}>
        <Card className={styles.toolbarPanel}>
          <FilterToolbar
            fields={fields}
            isPanelOpen={isFiltersOpen}
            onClosePanel={() => setIsFiltersOpen(false)}
            onResetField={(name, defaultValue) => {
              clearFilter(name as keyof CategoryFilters, defaultValue as CategoryFilters[keyof CategoryFilters]);
            }}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
          />
        </Card>

        <CategoryList
          filters={filters}
          selectedId={selectedId}
          onSelect={handleSelect}
          refreshKey={refreshKey}
          onOptionsLoaded={setCategoryOptions}
        />

        {isDrawerOpen ? (
          <Drawer
            description={isCreating ? t("categories.newDescription") : t("categories.editDescription")}
            onClose={handleCloseDrawer}
            title={isCreating ? t("categories.newTitle") : t("categories.detailsTitle")}
          >
            <CategoryForm
              category={selectedCategory}
              categoryOptions={categoryOptions}
              user={user!}
              onSuccess={handleSuccess}
              onCancel={handleCloseDrawer}
            />
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
