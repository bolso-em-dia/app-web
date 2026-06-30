import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  archiveCategory,
  createCategory,
  listCategories,
  listCategoryOptions,
  type Category,
  type CategoryOption,
  updateCategory,
} from "../../app/api/categories";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Spinner from "../../components/feedback/Spinner";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
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

export default function CategoriesPage() {
  const { accessToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [options, setOptions] = useState<CategoryOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const loadCategories = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [categoriesResponse, optionsResponse] = await Promise.all([
        listCategories(accessToken),
        listCategoryOptions(getCurrentReferenceMonth(), accessToken),
      ]);

      setCategories(categoriesResponse);
      setOptions(optionsResponse);

      if (categoriesResponse.length > 0) {
        setSelectedId((current) =>
          current &&
          categoriesResponse.some((category) => category.id === current)
            ? current
            : categoriesResponse[0].id,
        );
      } else {
        setSelectedId(null);
      }
    } catch {
      setError("Unable to load categories.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

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
        setCategories((current) => [created, ...current]);
        setSelectedId(created.id);
        setIsCreating(false);
        await loadCategories();
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
        setCategories((current) =>
          current.map((category) =>
            category.id === updated.id ? updated : category,
          ),
        );
        await loadCategories();
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
      setCategories((current) =>
        current.map((category) =>
          category.id === archived.id ? archived : category,
        ),
      );
      await loadCategories();
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
    setError(null);
    if (categories[0]) {
      setSelectedId(categories[0].id);
    }
  }

  const archiveOptions = options.filter(
    (option) => option.id !== selectedCategory?.id,
  );

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
        <section className={styles.layout}>
          <Card className={styles.listPanel}>
            <div className={styles.listHeader}>
              <h2 className={styles.panelTitle}>Categories</h2>
              <span className={styles.count}>{categories.length}</span>
            </div>

            <div className={styles.categoryList}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={
                    category.id === selectedId && !isCreating
                      ? `${styles.categoryItem} ${styles.categoryItemActive}`
                      : styles.categoryItem
                  }
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedId(category.id);
                    setError(null);
                  }}
                >
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
                </button>
              ))}
            </div>
          </Card>

          <div className={styles.sidePanels}>
            <Card className={styles.formPanel}>
              <div className={styles.formHeader}>
                <div>
                  <h2 className={styles.panelTitle}>
                    {isCreating ? "New category" : "Category details"}
                  </h2>
                  <p className={styles.formSubtitle}>
                    {isCreating
                      ? "Create a category with display metadata."
                      : "Update the category fields used across the app."}
                  </p>
                </div>
              </div>

              <form
                className={styles.form}
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
              >
                <Field
                  label="Name"
                  htmlFor="category-name"
                  error={form.formState.errors.name?.message}
                >
                  <Input
                    id="category-name"
                    hasError={Boolean(form.formState.errors.name)}
                    {...form.register("name")}
                  />
                </Field>

                <Field
                  label="Icon"
                  htmlFor="category-icon"
                  error={form.formState.errors.icon?.message}
                >
                  <Input
                    id="category-icon"
                    hasError={Boolean(form.formState.errors.icon)}
                    {...form.register("icon")}
                  />
                </Field>

                <Field
                  label="Color"
                  htmlFor="category-color"
                  error={form.formState.errors.color?.message}
                >
                  <Input
                    id="category-color"
                    placeholder="#2254d1"
                    hasError={Boolean(form.formState.errors.color)}
                    {...form.register("color")}
                  />
                </Field>

                <FormError>{error}</FormError>

                <div className={styles.formActions}>
                  <Button type="submit" loading={isSaving}>
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
            </Card>

            {!isCreating && selectedCategory ? (
              <Card className={styles.archivePanel}>
                <div className={styles.formHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Archive category</h2>
                    <p className={styles.formSubtitle}>
                      Archived categories require a replacement for future use.
                    </p>
                  </div>
                </div>

                <form
                  className={styles.form}
                  onSubmit={archiveForm.handleSubmit(onArchive)}
                  noValidate
                >
                  <Field
                    label="Archive month"
                    htmlFor="archive-month"
                    error={
                      archiveForm.formState.errors.archivedFromMonth?.message
                    }
                  >
                    <Input
                      id="archive-month"
                      type="date"
                      hasError={Boolean(
                        archiveForm.formState.errors.archivedFromMonth,
                      )}
                      {...archiveForm.register("archivedFromMonth")}
                    />
                  </Field>

                  <Field
                    label="Replacement category"
                    htmlFor="replacement-category"
                    error={
                      archiveForm.formState.errors.replacementCategoryId
                        ?.message
                    }
                  >
                    <Select
                      id="replacement-category"
                      hasError={Boolean(
                        archiveForm.formState.errors.replacementCategoryId,
                      )}
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

                  <Button type="submit" loading={isArchiving}>
                    Archive category
                  </Button>
                </form>
              </Card>
            ) : null}
          </div>
        </section>
      )}
    </AppShell>
  );
}
