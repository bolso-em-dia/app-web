import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { archiveCategory, createCategory, updateCategory, type Category, type CategoryOption } from "../../app/api/categories";
import { useAuth } from "../../app/auth/useAuth";
import type { AuthUser } from "../../app/api/auth";
import Button from "../../components/ui/Button";
import CategorySelect from "../../components/ui/CategorySelect";
import ColorSwatchSelect from "../../components/ui/ColorSwatchSelect";
import ConfirmAction from "../../components/ui/ConfirmAction";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import IconSelect from "../../components/ui/IconSelect";
import Input from "../../components/ui/Input";
import { buildColorOptions, buildIconOptions } from "../../lib/uiOptions";
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

interface CategoryFormProps {
  category: Category | null;
  categoryOptions: CategoryOption[];
  user: AuthUser;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CategoryForm({ category, categoryOptions, onSuccess, onCancel }: CategoryFormProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const isCreating = category === null;
  const categoryId = category?.id ?? null;
  const archivedFromMonth = category?.archivedFromMonth ?? null;

  const initialValues = !category
    ? DEFAULT_VALUES
    : {
        name: category.name,
        icon: category.icon ?? "",
        color: category.color ?? "",
      };

  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categorySchema = useMemo(() => createCategorySchema(t), [t]);
  const archiveCategorySchema = useMemo(() => createArchiveCategorySchema(t), [t]);
  const colorOptions = useMemo(() => buildColorOptions(t), [t]);
  const iconOptions = useMemo(() => buildIconOptions(t), [t]);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialValues ?? DEFAULT_VALUES,
  });

  const archiveForm = useForm<ArchiveCategoryFormValues>({
    resolver: zodResolver(archiveCategorySchema),
    defaultValues: {
      replacementCategoryId: categoryOptions.find((o) => o.id !== categoryId)?.id ?? "",
    },
  });

  const archiveOptions = categoryOptions.filter((option) => option.id !== categoryId);

  async function handleSubmit(values: CategoryFormValues) {
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
      } else if (categoryId) {
        await updateCategory(
          categoryId,
          {
            name: values.name,
            icon: values.icon || undefined,
            color: values.color || undefined,
          },
          accessToken,
        );
      }
      onSuccess();
    } catch {
      setError(t("categories.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive(values: ArchiveCategoryFormValues) {
    if (!accessToken || !categoryId) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      await archiveCategory(categoryId, values, accessToken);
      onSuccess();
    } catch {
      setError(t("categories.archiveError"));
    } finally {
      setIsArchiving(false);
    }
  }

  const iconValue = form.watch("icon");
  const colorValue = form.watch("color");

  return (
    <div className={styles.drawerStack}>
      <form className={styles.form} onSubmit={form.handleSubmit(handleSubmit)} noValidate>
        <Field error={form.formState.errors.name?.message} htmlFor="category-name" label={t("common.name")}>
          <Input hasError={Boolean(form.formState.errors.name)} id="category-name" {...form.register("name")} />
        </Field>

        <Field error={form.formState.errors.icon?.message} htmlFor="category-icon" label={t("categories.icon")}>
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
            options={iconOptions}
            value={iconValue}
          />
        </Field>

        <Field error={form.formState.errors.color?.message} htmlFor="category-color" label={t("categories.color")}>
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
            options={colorOptions}
            value={colorValue}
          />
        </Field>

        {error ? <FormError>{error}</FormError> : null}

        <div className={styles.formActions}>
          <Button loading={isSaving} type="submit">
            {isCreating ? t("categories.create") : t("common.save")}
          </Button>
          {isCreating ? (
            <Button onClick={onCancel} type="button" variant="subtle">
              {t("common.cancel")}
            </Button>
          ) : null}
        </div>
      </form>

      {!isCreating && !archivedFromMonth ? (
        <form className={styles.form} noValidate>
          <Field
            error={archiveForm.formState.errors.replacementCategoryId?.message}
            htmlFor="replacement-category"
            label={t("categories.replacementCategory")}
          >
            <Controller
              control={archiveForm.control}
              name="replacementCategoryId"
              render={({ field }) => (
                <CategorySelect
                  hasError={Boolean(archiveForm.formState.errors.replacementCategoryId)}
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
            <Button type="button" onClick={() => setIsArchiveConfirmOpen(true)} variant="danger">
              {t("common.archive")}
            </Button>
          </div>
        </form>
      ) : null}

      <ConfirmAction
        confirmLabel={t("common.archive")}
        loading={isArchiving}
        message={t("confirmations.archiveCategory")}
        onCancel={() => setIsArchiveConfirmOpen(false)}
        onConfirm={() => {
          setIsArchiveConfirmOpen(false);
          void archiveForm.handleSubmit(handleArchive)();
        }}
        open={isArchiveConfirmOpen}
        title={t("categories.archiveTitle")}
      />
    </div>
  );
}
