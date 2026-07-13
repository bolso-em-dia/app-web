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
import type { CategoryFormValues } from "../../lib/validation/categorySchema";
import { useI18n } from "../../app/i18n/I18nContext";
import { type StatusFilter } from "../../lib/constants";
import CategoryList from "./CategoryList";
import CategoryForm from "./CategoryForm";
import styles from "./CategoriesPage.module.scss";

export default function CategoriesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialFormValues, setInitialFormValues] =
    useState<CategoryFormValues | null>(null);
  const [categoryArchivedFromMonth, setCategoryArchivedFromMonth] = useState<
    string | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  const activeFilters = useMemo(
    () => [
      ...(search
        ? [
            {
              key: "search",
              label: `${t("common.search")}: ${search}`,
              onRemove: () => {
                setSearch("");
              },
            },
          ]
        : []),
      ...(statusFilter !== "ACTIVE"
        ? [
            {
              key: "status",
              label: `${t("common.status")}: ${t(
                statusFilter === "ALL" ? "common.all" : "common.archived",
              )}`,
              onRemove: () => {
                setStatusFilter("ACTIVE");
              },
            },
          ]
        : []),
    ],
    [search, statusFilter, t],
  );

  function clearFilters() {
    setSearch("");
    setStatusFilter("ACTIVE");
  }

  function handleStartCreate() {
    setIsCreating(true);
    setSelectedId(null);
    setInitialFormValues(null);
    setCategoryArchivedFromMonth(null);
  }

  function handleCloseDrawer() {
    setIsCreating(false);
    setSelectedId(null);
    setInitialFormValues(null);
    setCategoryArchivedFromMonth(null);
  }

  function handleSuccess() {
    handleCloseDrawer();
    setRefreshKey((k) => k + 1);
  }

  function handleSelect(_id: string, category: Category) {
    setIsCreating(false);
    setSelectedId(category.id);
    setInitialFormValues({
      name: category.name,
      icon: category.icon ?? "",
      color: category.color ?? "",
    });
    setCategoryArchivedFromMonth(category.archivedFromMonth);
  }

  const drawerOpen = isCreating || selectedId !== null;

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
            onClearFilters={clearFilters}
            onClosePanel={() => setIsFiltersOpen(false)}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
            primaryContent={
              <Field htmlFor="category-search" label={t("common.search")}>
                <Input
                  id="category-search"
                  onChange={(event) => {
                    setSearch(event.target.value);
                  }}
                  placeholder={t("categories.searchPlaceholder")}
                  value={search}
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
                      setStatusFilter(event.target.value as StatusFilter);
                    }}
                    value={statusFilter}
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
          search={search}
          statusFilter={statusFilter}
          selectedId={selectedId}
          onSelect={handleSelect}
          refreshKey={refreshKey}
          onOptionsLoaded={setCategoryOptions}
        />

        {drawerOpen ? (
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
              categoryId={isCreating ? null : selectedId}
              categoryArchivedFromMonth={
                isCreating ? null : categoryArchivedFromMonth
              }
              initialValues={isCreating ? null : initialFormValues}
              user={user!}
              categoryOptions={categoryOptions}
              onSuccess={handleSuccess}
              onCancel={handleCloseDrawer}
            />
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
