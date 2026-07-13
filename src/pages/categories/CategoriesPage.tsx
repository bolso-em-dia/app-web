import { useMemo, useState } from "react";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import type { Category, CategoryOption } from "../../app/api/categories";
import { useI18n } from "../../app/i18n/I18nContext";
import { ACTIVE_STATUS_FILTER, type StatusFilter } from "../../lib/constants";
import {
  buildSearchActiveFilter,
  buildStatusActiveFilter,
  compileActiveFilters,
} from "../../lib/activeFilters";
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
  const { filters, patchFilters, clearFilter, resetFilters } =
    useFiltersState(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [showDrawer, setShowDrawer] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  const activeFilters = useMemo(
    () =>
      compileActiveFilters([
        buildSearchActiveFilter(filters.search, t("common.search"), () => {
          clearFilter("search", "");
        }),
        buildStatusActiveFilter(filters.status, t, () => {
          clearFilter("status", ACTIVE_STATUS_FILTER);
        }),
      ]),
    [filters, t, clearFilter],
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
            activeFilters={activeFilters}
            isPanelOpen={isFiltersOpen}
            onClearFilters={() => resetFilters()}
            onClosePanel={() => setIsFiltersOpen(false)}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
            primaryContent={
              <Field htmlFor="category-search" label={t("common.search")}>
                <Input
                  id="category-search"
                  onChange={(event) => {
                    patchFilters({ search: event.target.value });
                  }}
                  placeholder={t("categories.searchPlaceholder")}
                  value={filters.search}
                />
              </Field>
            }
            secondaryContent={
              <>
                <Field
                  htmlFor="category-status-filter"
                  label={t("common.status")}
                >
                  <Select
                    id="category-status-filter"
                    onChange={(event) => {
                      patchFilters({
                        status: event.target.value as StatusFilter,
                      });
                    }}
                    value={filters.status}
                  >
                    <option value="ALL">{t("common.all")}</option>
                    <option value="ACTIVE">{t("common.active")}</option>
                    <option value="ARCHIVED">{t("common.archived")}</option>
                  </Select>
                </Field>
              </>
            }
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
            description={
              isCreating
                ? t("categories.newDescription")
                : t("categories.editDescription")
            }
            onClose={handleCloseDrawer}
            title={
              isCreating
                ? t("categories.newTitle")
                : t("categories.detailsTitle")
            }
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
