import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import CategorySelect from "../../components/ui/CategorySelect";
import ColorSwatchSelect from "../../components/ui/ColorSwatchSelect";
import ConfirmAction from "../../components/ui/ConfirmAction";
import Drawer from "../../components/ui/Drawer";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import FormError from "../../components/ui/FormError";
import IconSelect from "../../components/ui/IconSelect";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { getCurrentReferenceMonth } from "../../lib/formatters/date";
import { getStoredIcon } from "../../lib/icons";
import { COLOR_OPTIONS, ICON_OPTIONS } from "../../lib/uiOptions";
import {
  createArchiveCategorySchema,
  createCategorySchema,
  type ArchiveCategoryFormValues,
  type CategoryFormValues,
} from "../../lib/validation/categorySchema";
import { useI18n } from "../../app/i18n/I18nContext";
import styles from "./CategoriesPage.module.scss";

const DEFAULT_VALUES: CategoryFormValues = {
  name: "",
  icon: "",
  color: "",
};
const DEFAULT_PAGE_SIZE = 12;

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
  const [totalPages, setTotalPages] = useState(0);
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
        setTotalPages(categoriesResponse.totalPages);
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

  useEffect(() => {
    if (isCreating) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (selectedCategory) {
      form.reset({
        name: selectedCategory.name,
        icon: selectedCategory.icon ?? "",
        color: selectedCategory.color ?? "",
      });
    }
  }, [form, isCreating, selectedCategory]);

  useEffect(() => {
    if (!selectedCategory) {
      archiveForm.reset({
        replacementCategoryId: "",
      });
      return;
    }

    const replacementOption = options.find(
      (option) => option.id !== selectedCategory.id,
    );

    archiveForm.reset({
      replacementCategoryId:
        selectedCategory.replacementCategoryId ?? replacementOption?.id ?? "",
    });
  }, [archiveForm, options, selectedCategory]);

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
  }

  function handleCancelCreate() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
  }

  function handleCloseDrawer() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
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
  const iconValue = form.watch("icon");
  const colorValue = form.watch("color");
  const rangeStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const rangeEnd =
    totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);
  const hasPreviousPage = page > 0;
  const hasNextPage = page + 1 < totalPages;

  return (
    <AppShell
      title={t("categories.title")}
      subtitle={t("categories.subtitle")}
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

            <section className={styles.categoryGrid}>
              {categories.map((category) => {
                const Icon = getStoredIcon(category.icon);

                return (
                  <Card key={category.id} className={styles.categoryCard}>
                    <button
                      className={styles.categoryButton}
                      onClick={() => {
                        setIsCreating(false);
                        setSelectedId(category.id);
                        setError(null);
                      }}
                      style={
                        category.color
                          ? { borderInlineStartColor: category.color }
                          : undefined
                      }
                      type="button"
                    >
                      <div className={styles.categoryCardHeader}>
                        <div className={styles.categoryTitleRow}>
                          {Icon ? (
                            <span
                              aria-hidden="true"
                              className={styles.categoryTitleIcon}
                              style={
                                category.color
                                  ? { color: category.color }
                                  : undefined
                              }
                            >
                              <Icon className={styles.categoryMetaIcon} />
                            </span>
                          ) : null}
                          <strong>{category.name}</strong>
                        </div>

                        <div className={styles.categoryBadges}>
                          <span
                            className={
                              category.archivedFromMonth
                                ? `${styles.badge} ${styles.badgeMuted}`
                                : `${styles.badge} ${styles.badgeSuccess}`
                            }
                          >
                            {category.archivedFromMonth
                              ? t("common.archived")
                              : t("common.active")}
                          </span>
                        </div>
                      </div>
                    </button>
                  </Card>
                );
              })}
            </section>

            <Card className={styles.footerPanel}>
              <div className={styles.footerBar}>
                <p className={styles.resultSummary}>
                  {totalItems === 0
                    ? t("categories.empty")
                    : t("common.range", {
                        start: rangeStart,
                        end: rangeEnd,
                        total: totalItems,
                      })}
                </p>

                <div className={styles.paginationControls}>
                  <label
                    className={styles.pageSizeControl}
                    htmlFor="category-page-size"
                  >
                    <span className={styles.pageSizeLabel}>
                      {t("common.rows")}
                    </span>
                    <Select
                      className={styles.pageSizeSelect}
                      id="category-page-size"
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setPage(0);
                      }}
                      value={String(pageSize)}
                    >
                      <option value="12">12</option>
                      <option value="24">24</option>
                      <option value="48">48</option>
                    </Select>
                  </label>

                  <div className={styles.pageButtons}>
                    <Button
                      disabled={!hasPreviousPage}
                      onClick={() => setPage((current) => current - 1)}
                      type="button"
                      variant="subtle"
                    >
                      {t("common.previous")}
                    </Button>
                    <span className={styles.pageIndicator}>
                      {t("common.pageOf", {
                        page: totalPages === 0 ? 0 : page + 1,
                        total: totalPages,
                      })}
                    </span>
                    <Button
                      disabled={!hasNextPage}
                      onClick={() => setPage((current) => current + 1)}
                      type="button"
                      variant="subtle"
                    >
                      {t("common.next")}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
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
              <div className={styles.drawerStack}>
                <form
                  className={styles.form}
                  onSubmit={form.handleSubmit(onSubmit)}
                  noValidate
                >
                  <Field
                    error={form.formState.errors.name?.message}
                    htmlFor="category-name"
                    label={t("common.name")}
                  >
                    <Input
                      hasError={Boolean(form.formState.errors.name)}
                      id="category-name"
                      {...form.register("name")}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.icon?.message}
                    htmlFor="category-icon"
                    label={t("categories.icon")}
                  >
                    <IconSelect
                      clearLabel={t("common.clearSelection")}
                      id="category-icon"
                      onChange={(value) =>
                        form.setValue("icon", value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                      options={ICON_OPTIONS}
                      value={iconValue}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.color?.message}
                    htmlFor="category-color"
                    label={t("categories.color")}
                  >
                    <ColorSwatchSelect
                      clearLabel={t("common.clearSelection")}
                      id="category-color"
                      onChange={(value) =>
                        form.setValue("color", value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                      options={COLOR_OPTIONS}
                      value={colorValue}
                    />
                  </Field>

                  {error ? <FormError>{error}</FormError> : null}

                  <div className={styles.formActions}>
                    <Button loading={isSaving} type="submit">
                      {isCreating
                        ? t("categories.create")
                        : t("common.saveChanges")}
                    </Button>
                    {isCreating ? (
                      <Button
                        onClick={handleCancelCreate}
                        type="button"
                        variant="subtle"
                      >
                        {t("common.cancel")}
                      </Button>
                    ) : null}
                  </div>
                </form>

                {!isCreating &&
                selectedCategory &&
                !selectedCategory.archivedFromMonth ? (
                  <form
                    className={styles.form}
                    onSubmit={archiveForm.handleSubmit(onArchive)}
                    noValidate
                  >
                    <Field
                      error={
                        archiveForm.formState.errors.replacementCategoryId
                          ?.message
                      }
                      htmlFor="replacement-category"
                      label={t("categories.replacementCategory")}
                    >
                      <Controller
                        control={archiveForm.control}
                        name="replacementCategoryId"
                        render={({ field }) => (
                          <CategorySelect
                            hasError={Boolean(
                              archiveForm.formState.errors
                                .replacementCategoryId,
                            )}
                            id="replacement-category"
                            onChange={field.onChange}
                            options={archiveOptions}
                            placeholder={t("categories.selectReplacement")}
                            value={field.value}
                          />
                        )}
                      />
                    </Field>

                    <div className={styles.formActions}>
                      <Button
                        type="button"
                        onClick={() => setIsArchiveConfirmOpen(true)}
                        variant="danger"
                      >
                        {t("categories.archiveAction")}
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>
            <ConfirmAction
                confirmLabel={t("categories.archiveAction")}
                loading={isArchiving}
                message={t("confirmations.archiveCategory")}
                onCancel={() => setIsArchiveConfirmOpen(false)}
                onConfirm={() => {
                  setIsArchiveConfirmOpen(false);
                  void archiveForm.handleSubmit(onArchive)();
                }}
                open={isArchiveConfirmOpen}
                title={t("categories.archiveTitle")}
              />
            </Drawer>
          ) : null}
        </>
      )}
    </AppShell>
  );
}
