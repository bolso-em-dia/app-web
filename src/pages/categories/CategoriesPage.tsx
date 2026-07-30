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
import { useMobileSearchToggle } from "../../lib/useMobileSearchToggle";
import { useFiltersState } from "../../lib/useFiltersState";
import CategoryList from "./CategoryList";
import CategoryForm from "./CategoryForm";
import styles from "./CategoriesPage.module.scss";

type CategoryFilters = { search: string; status: StatusFilter };
type DrawerState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; id: string; category: Category };

const DEFAULT_FILTERS: CategoryFilters = {
  search: "",
  status: ACTIVE_STATUS_FILTER,
};

export default function CategoriesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { filters, patchFilters, clearFilter } = useFiltersState(DEFAULT_FILTERS);
  const [drawerState, setDrawerState] = useState<DrawerState>({ mode: "closed" });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const mobileSearch = useMobileSearchToggle();

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
            inputRef={mobileSearch.inputRef}
            label={t("common.search")}
            onBlur={mobileSearch.handleBlur}
            onChange={(search) => {
              patchFilters({ search });
            }}
            onFocus={mobileSearch.handleFocus}
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
    [filters.search, filters.status, mobileSearch.handleBlur, mobileSearch.handleFocus, mobileSearch.inputRef, patchFilters, t],
  );

  function handleSelect(_id: string, category: Category) {
    setDrawerState({ mode: "edit", id: category.id, category });
  }

  function handleStartCreate() {
    setDrawerState({ mode: "create" });
  }

  function handleCloseDrawer() {
    setDrawerState({ mode: "closed" });
  }

  function handleSuccess() {
    setRefreshKey((k) => k + 1);
    setDrawerState({ mode: "closed" });
  }

  const isCreating = drawerState.mode === "create";
  const isDrawerOpen = drawerState.mode !== "closed";
  const selectedId = drawerState.mode === "edit" ? drawerState.id : null;
  const selectedCategory = drawerState.mode === "edit" ? drawerState.category : null;

  return (
    <AppShell
      mobileActionBarHidden={isDrawerOpen}
      mobileSearchDockVisible={mobileSearch.isOpen}
      mobileActions={{
        createLabel: t("categories.new"),
        onCreate: handleStartCreate,
        onSearch: mobileSearch.open,
        searchExpanded: mobileSearch.isOpen,
      }}
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
            onDismissMobileSearchFocus={mobileSearch.blurInput}
            onCloseMobileSearch={mobileSearch.close}
            isMobileSearchFocused={mobileSearch.isFocused}
            isMobileSearchOpen={mobileSearch.isOpen}
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
          <Drawer onClose={handleCloseDrawer} title={isCreating ? t("categories.newTitle") : t("categories.detailsTitle")}>
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
