import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  archiveCategory,
  createCategory,
  listCategories,
  listCategoryOptions,
  type CategoryListParams,
  type Category,
  type CategoryOption,
  updateCategory,
} from "../../app/api/categories";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import Input from "../../components/ui/Input";
import PaginationBar from "../../components/ui/PaginationBar";
import Select from "../../components/ui/Select";
import { getCurrentReferenceMonth } from "../../lib/formatters/date";
import {
  createArchiveCategorySchema,
  createCategorySchema,
  type ArchiveCategoryFormValues,
  type CategoryFormValues,
} from "../../lib/validation/categorySchema";
import { useI18n } from "../../app/i18n/I18nContext";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";
import { usePagination } from "../../lib/usePagination";
import CategoryList from "./CategoryList";
import CategoryForm from "./CategoryForm";
import styles from "./CategoriesPage.module.scss";

const DEFAULT_VALUES: CategoryFormValues = {
  name: "",
  icon: "",
  color: "",
};

export default function CategoriesPage() {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [options, setOptions] = useState<CategoryOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ACTIVE");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedId) ?? null,
    [categories, selectedId],
  );

  const categorySchema = useMemo(() => createCategorySchema(t), [t]);
  const archiveCategorySchema = useMemo(
    () => createArchiveCategorySchema(t),
    [t],
  );

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: DEFAULT_VALUES,
  });

  const archiveForm = useForm<ArchiveCategoryFormValues>({
    resolver: zodResolver(archiveCategorySchema),
    defaultValues: {
      replacementCategoryId: "",
    },
  });

  const loadCategories = useCallback(
    async (params: CategoryListParams) => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [categoriesResponse, optionsResponse] = await Promise.all([
          listCategories(params, accessToken),
          listCategoryOptions(getCurrentReferenceMonth(), accessToken),
        ]);

        setCategories(categoriesResponse.items);
        setPage(categoriesResponse.page);
        setPageSize(categoriesResponse.size);
        setTotalItems(categoriesResponse.totalItems);
        setOptions(optionsResponse);
        setSelectedId((current) =>
          current &&
          categoriesResponse.items.some((category) => category.id === current)
            ? current
            : null,
        );
      } catch {
        setError(t("categories.error"));
      } finally {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [accessToken, t],
  );

  useEffect(() => {
    void loadCategories({
      page,
      size: pageSize,
      search,
      status: statusFilter,
    });
  }, [loadCategories, page, pageSize, search, statusFilter]);

  async function onSubmit(values: CategoryFormValues) {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        await createCategory(
          {
            name: values.name,
            icon: values.icon || undefined,
            color: values.color || undefined,
          },
          accessToken,
        );
        handleCloseDrawer();
        await loadCategories({
          page,
          size: pageSize,
          search,
          status: statusFilter,
        });
      } else if (selectedCategory) {
        await updateCategory(
          selectedCategory.id,
          {
            name: values.name,
            icon: values.icon || undefined,
            color: values.color || undefined,
          },
          accessToken,
        );
        handleCloseDrawer();
        await loadCategories({
          page,
          size: pageSize,
          search,
          status: statusFilter,
        });
      }
    } catch {
      setError(t("categories.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function onArchive(values: ArchiveCategoryFormValues) {
    if (!accessToken || !selectedCategory) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      const archived = await archiveCategory(
        selectedCategory.id,
        values,
        accessToken,
      );
      setSelectedId(archived.id);
      await loadCategories({
        page,
        size: pageSize,
        search,
        status: statusFilter,
      });
    } catch {
      setError(t("categories.archiveError"));
    } finally {
      setIsArchiving(false);
    }
  }

  function handleStartCreate() {
    setIsCreating(true);
    setSelectedId(null);
    setError(null);
    form.reset(DEFAULT_VALUES);
    archiveForm.reset({ replacementCategoryId: "" });
  }

  function handleCancelCreate() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
    form.reset(DEFAULT_VALUES);
    archiveForm.reset({ replacementCategoryId: "" });
  }

  function handleCloseDrawer() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
    form.reset(DEFAULT_VALUES);
    archiveForm.reset({ replacementCategoryId: "" });
  }

  const activeFilters = useMemo(
    () => [
      ...(search
        ? [
            {
              key: "search",
              label: `${t("common.search")}: ${search}`,
              onRemove: () => {
                setSearch("");
                setPage(0);
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
                setPage(0);
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
    setPage(0);
  }

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const archiveOptions = options.filter(
    (option) => option.id !== selectedCategory?.id,
  );
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const pagination = usePagination(page, pageSize, totalItems, totalPages);

  return (
    <AppShell
      title={t("categories.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("categories.new")}
        </Button>
      }
    >
      {showInitialLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label={t("categories.loading")} />
        </Card>
      ) : (
        <>
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
                        setPage(0);
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
                          setStatusFilter(
                            event.target.value as "ALL" | "ACTIVE" | "ARCHIVED",
                          );
                          setPage(0);
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
              categories={categories}
              selectedId={selectedId}
              onCardSelect={(id, category) => {
                setIsCreating(false);
                setSelectedId(id);
                setError(null);
                form.reset({
                  name: category.name,
                  icon: category.icon ?? "",
                  color: category.color ?? "",
                });
                archiveForm.reset({
                  replacementCategoryId:
                    options.find((o) => o.id !== category.id)?.id ?? "",
                });
              }}
            />

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
          </section>

          {isCreating || selectedCategory ? (
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
                archiveForm={archiveForm}
                archiveOptions={archiveOptions}
                error={error}
                form={form}
                isArchiveConfirmOpen={isArchiveConfirmOpen}
                isArchiving={isArchiving}
                isCreating={isCreating}
                isSaving={isSaving}
                selectedCategory={selectedCategory}
                onCancelCreate={handleCancelCreate}
                onArchiveCancel={() => setIsArchiveConfirmOpen(false)}
                onArchiveOpen={() => setIsArchiveConfirmOpen(true)}
                onArchiveSubmit={() => {
                  setIsArchiveConfirmOpen(false);
                  void archiveForm.handleSubmit(onArchive)();
                }}
                onSubmit={onSubmit}
              />
            </Drawer>
          ) : null}
        </>
      )}
    </AppShell>
  );
}
