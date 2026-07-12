import { Controller, type UseFormReturn } from "react-hook-form";
import Button from "../../components/ui/Button";
import CategorySelect from "../../components/ui/CategorySelect";
import ColorSwatchSelect from "../../components/ui/ColorSwatchSelect";
import ConfirmAction from "../../components/ui/ConfirmAction";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import IconSelect from "../../components/ui/IconSelect";
import Input from "../../components/ui/Input";
import { COLOR_OPTIONS, ICON_OPTIONS } from "../../lib/uiOptions";
import type {
  ArchiveCategoryFormValues,
  CategoryFormValues,
} from "../../lib/validation/categorySchema";
import type { Category, CategoryOption } from "../../app/api/categories";
import { useI18n } from "../../app/i18n/I18nContext";
import styles from "./CategoriesPage.module.scss";

interface CategoryFormProps {
  form: UseFormReturn<CategoryFormValues>;
  archiveForm: UseFormReturn<ArchiveCategoryFormValues>;
  isCreating: boolean;
  isSaving: boolean;
  isArchiving: boolean;
  isArchiveConfirmOpen: boolean;
  error: string | null;
  archiveOptions: CategoryOption[];
  selectedCategory: Category | null;
  onCancelCreate: () => void;
  onSubmit: (values: CategoryFormValues) => void;
  onArchiveOpen: () => void;
  onArchiveCancel: () => void;
  onArchiveSubmit: () => void;
}

export default function CategoryForm({
  form,
  archiveForm,
  isCreating,
  isSaving,
  isArchiving,
  isArchiveConfirmOpen,
  error,
  archiveOptions,
  selectedCategory,
  onCancelCreate,
  onSubmit,
  onArchiveOpen,
  onArchiveCancel,
  onArchiveSubmit,
}: CategoryFormProps) {
  const { t } = useI18n();
  const iconValue = form.watch("icon");
  const colorValue = form.watch("color");

  return (
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
            {isCreating ? t("categories.create") : t("common.save")}
          </Button>
          {isCreating ? (
            <Button onClick={onCancelCreate} type="button" variant="subtle">
              {t("common.cancel")}
            </Button>
          ) : null}
        </div>
      </form>

      {!isCreating &&
      selectedCategory &&
      !selectedCategory.archivedFromMonth ? (
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
                  hasError={Boolean(
                    archiveForm.formState.errors.replacementCategoryId,
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
            <Button type="button" onClick={onArchiveOpen} variant="danger">
              {t("common.archive")}
            </Button>
          </div>
        </form>
      ) : null}

      <ConfirmAction
        confirmLabel={t("common.archive")}
        loading={isArchiving}
        message={t("confirmations.archiveCategory")}
        onCancel={onArchiveCancel}
        onConfirm={onArchiveSubmit}
        open={isArchiveConfirmOpen}
        title={t("categories.archiveTitle")}
      />
    </div>
  );
}
