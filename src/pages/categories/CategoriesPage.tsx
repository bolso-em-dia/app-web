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
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { getCurrentReferenceMonth } from "../../lib/formatters/date";
import {
  archiveCategorySchema,
  categorySchema,
  type ArchiveCategoryFormValues,
  type CategoryFormValues,
} from "../../lib/validation/categorySchema";
import styles from "./CategoriesPage.module.scss";

const DEFAULT_VALUES: CategoryFormValues = {
  name: "",
  icon: "",
  color: "",
};
const DEFAULT_PAGE_SIZE = 12;

export default function CategoriesPage() {
  const { accessToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [options, setOptions] = useState<CategoryOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedId) ?? null,
    [categories, selectedId],
  );

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: DEFAULT_VALUES,
  });

  const archiveForm = useForm<ArchiveCategoryFormValues>({
    resolver: zodResolver(archiveCategorySchema),
    defaultValues: {
      archivedFromMonth: getCurrentReferenceMonth(),
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
        setError("Unable to load categories.");
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken],
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
        archivedFromMonth: getCurrentReferenceMonth(),
        replacementCategoryId: "",
      });
      return;
    }

    const replacementOption = options.find(
      (option) => option.id !== selectedCategory.id,
    );

    archiveForm.reset({
      archivedFromMonth: getCurrentReferenceMonth(),
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
        const created = await createCategory(
          {
            name: values.name,
            icon: values.icon || undefined,
            color: values.color || undefined,
          },
          accessToken,
        );
        setSelectedId(created.id);
        setIsCreating(false);
        setSearch(created.name);
        setStatusFilter("ALL");
        setPage(0);
      } else if (selectedCategory) {
        const updated = await updateCategory(
          selectedCategory.id,
          {
            name: values.name,
            icon: values.icon || undefined,
            color: values.color || undefined,
          },
          accessToken,
        );
        setSelectedId(updated.id);
        setSearch((current) =>
          current.trim().length === 0 ? current : updated.name,
        );
        setPage(0);
      }
    } catch {
      setError("Unable to save the category.");
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
      setPage(0);
    } catch {
      setError("Unable to archive the category.");
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

  const archiveOptions = options.filter(
    (option) => option.id !== selectedCategory?.id,
  );
  const rangeStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const rangeEnd =
    totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);
  const hasPreviousPage = page > 0;
  const hasNextPage = page + 1 < totalPages;

  return (
    <AppShell
      title="Categories"
      subtitle="Manage transaction categories and archive replacements."
      actions={
        <Button onClick={handleStartCreate} type="button">
          New category
        </Button>
      }
    >
      {isLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label="Loading categories" />
        </Card>
      ) : (
        <>
          <section className={styles.stack}>
            <Card className={styles.toolbarPanel}>
              <div className={styles.toolbar}>
                <div className={styles.filterGroup}>
                  <Field htmlFor="category-search" label="Search">
                    <Input
                      id="category-search"
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(0);
                      }}
                      placeholder="Search categories"
                      value={search}
                    />
                  </Field>

                  <Field htmlFor="category-status-filter" label="Status">
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
                      <option value="ALL">All</option>
                      <option value="ACTIVE">Active</option>
                      <option value="ARCHIVED">Archived</option>
                    </Select>
                  </Field>
                </div>
              </div>
            </Card>

            <section className={styles.categoryGrid}>
              {categories.map((category) => (
                <Card key={category.id} className={styles.categoryCard}>
                  <button
                    className={styles.categoryButton}
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedId(category.id);
                      setError(null);
                    }}
                    type="button"
                  >
                    <div className={styles.categoryCardHeader}>
                      <div>
                        <strong>{category.name}</strong>
                        <p className={styles.categoryMeta}>
                          {category.icon || "No icon"} ·{" "}
                          {category.color || "No color"}
                        </p>
                      </div>
                      <div className={styles.categoryBadges}>
                        <span
                          className={
                            category.archivedFromMonth
                              ? `${styles.badge} ${styles.badgeMuted}`
                              : `${styles.badge} ${styles.badgeSuccess}`
                          }
                        >
                          {category.archivedFromMonth ? "Archived" : "Active"}
                        </span>
                      </div>
                    </div>
                  </button>
                </Card>
              ))}
            </section>

            <Card className={styles.footerPanel}>
              <div className={styles.footerBar}>
                <p className={styles.resultSummary}>
                  {totalItems === 0
                    ? "No categories found"
                    : `${rangeStart}-${rangeEnd} of ${totalItems}`}
                </p>

                <div className={styles.paginationControls}>
                  <label
                    className={styles.pageSizeControl}
                    htmlFor="category-page-size"
                  >
                    <span className={styles.pageSizeLabel}>Rows</span>
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
                      variant="secondary"
                    >
                      Previous
                    </Button>
                    <span className={styles.pageIndicator}>
                      Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
                    </span>
                    <Button
                      disabled={!hasNextPage}
                      onClick={() => setPage((current) => current + 1)}
                      type="button"
                      variant="secondary"
                    >
                      Next
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
                  ? "Create a category with display metadata."
                  : "Update the category fields used across the app."
              }
              onClose={handleCloseDrawer}
              title={isCreating ? "New category" : "Category details"}
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
                    label="Name"
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
                    label="Icon"
                  >
                    <Input
                      hasError={Boolean(form.formState.errors.icon)}
                      id="category-icon"
                      {...form.register("icon")}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.color?.message}
                    htmlFor="category-color"
                    label="Color"
                  >
                    <Input
                      hasError={Boolean(form.formState.errors.color)}
                      id="category-color"
                      placeholder="#2254d1"
                      {...form.register("color")}
                    />
                  </Field>

                  {error ? <FormError>{error}</FormError> : null}

                  <div className={styles.formActions}>
                    <Button loading={isSaving} type="submit">
                      {isCreating ? "Create category" : "Save changes"}
                    </Button>
                    {isCreating ? (
                      <Button
                        onClick={handleCancelCreate}
                        type="button"
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </form>

                {!isCreating && selectedCategory ? (
                  <Card className={styles.archivePanel}>
                    <div className={styles.formHeader}>
                      <div>
                        <h3 className={styles.sectionTitle}>
                          Archive category
                        </h3>
                        <p className={styles.formSubtitle}>
                          Archived categories require a replacement for future
                          use.
                        </p>
                      </div>
                    </div>

                    <form
                      className={styles.form}
                      onSubmit={archiveForm.handleSubmit(onArchive)}
                      noValidate
                    >
                      <Field
                        error={
                          archiveForm.formState.errors.archivedFromMonth
                            ?.message
                        }
                        htmlFor="archive-month"
                        label="Archive month"
                      >
                        <Input
                          hasError={Boolean(
                            archiveForm.formState.errors.archivedFromMonth,
                          )}
                          id="archive-month"
                          type="date"
                          {...archiveForm.register("archivedFromMonth")}
                        />
                      </Field>

                      <Field
                        error={
                          archiveForm.formState.errors.replacementCategoryId
                            ?.message
                        }
                        htmlFor="replacement-category"
                        label="Replacement category"
                      >
                        <Select
                          hasError={Boolean(
                            archiveForm.formState.errors.replacementCategoryId,
                          )}
                          id="replacement-category"
                          {...archiveForm.register("replacementCategoryId")}
                        >
                          <option value="">Select a replacement</option>
                          {archiveOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Button loading={isArchiving} type="submit">
                        Archive category
                      </Button>
                    </form>
                  </Card>
                ) : null}
              </div>
            </Drawer>
          ) : null}
        </>
      )}
    </AppShell>
  );
}
