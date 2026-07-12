import type { UseFormReturn } from "react-hook-form";
import { useI18n } from "../../app/i18n/I18nContext";
import type { FamilyMember } from "../../app/api/family";
import Button from "../../components/ui/Button";
import Checkbox from "../../components/ui/Checkbox";
import ConfirmAction from "../../components/ui/ConfirmAction";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import styles from "./FamilyPage.module.scss";

type FormValues =
  | import("../../lib/validation/familyMemberSchema").CreateFamilyMemberFormValues
  | import("../../lib/validation/familyMemberSchema").UpdateFamilyMemberFormValues;

type FamilyMemberFormProps = {
  form: UseFormReturn<FormValues>;
  isCreating: boolean;
  isSaving: boolean;
  isArchiving: boolean;
  error: string | null;
  selectedMember: FamilyMember | null;
  isArchiveConfirmOpen: boolean;
  isRestoreConfirmOpen: boolean;
  onArchiveOpen: () => void;
  onArchiveCancel: () => void;
  onArchiveConfirm: () => void;
  onRestoreOpen: () => void;
  onRestoreCancel: () => void;
  onRestoreConfirm: () => void;
  onCancelCreate: () => void;
  onSubmit: (values: FormValues) => void;
};

export default function FamilyMemberForm({
  form,
  isCreating,
  isSaving,
  isArchiving,
  error,
  selectedMember,
  isArchiveConfirmOpen,
  isRestoreConfirmOpen,
  onArchiveOpen,
  onArchiveCancel,
  onArchiveConfirm,
  onRestoreOpen,
  onRestoreCancel,
  onRestoreConfirm,
  onCancelCreate,
  onSubmit,
}: FamilyMemberFormProps) {
  const { t } = useI18n();

  return (
    <>
      <div className={styles.drawerStack}>
        <form
          className={styles.form}
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <Field
            error={form.formState.errors.name?.message}
            htmlFor="family-name"
            label={t("common.name")}
          >
            <Input
              id="family-name"
              hasError={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
          </Field>

          <Field
            error={form.formState.errors.email?.message}
            htmlFor="family-email"
            label={t("common.email")}
          >
            <Input
              id="family-email"
              hasError={Boolean(form.formState.errors.email)}
              type="email"
              {...form.register("email")}
            />
          </Field>

          <Field
            error={form.formState.errors.password?.message}
            htmlFor="family-password"
            label={
              isCreating
                ? t("family.password")
                : t("family.passwordOptional")
            }
          >
            <Input
              id="family-password"
              hasError={Boolean(form.formState.errors.password)}
              type="password"
              {...form.register("password")}
            />
          </Field>

          <Field
            error={form.formState.errors.role?.message}
            htmlFor="family-role"
            label={t("common.role")}
          >
            <Select
              id="family-role"
              hasError={Boolean(form.formState.errors.role)}
              {...form.register("role")}
            >
              <option value="USER">{t("roles.USER")}</option>
              <option value="ADMIN">{t("roles.ADMIN")}</option>
            </Select>
          </Field>

          <Checkbox
            label={t("family.allowanceEnabled")}
            {...form.register("allowanceEnabled")}
          />

          <FormError>{error}</FormError>

          <div className={styles.formActions}>
            <Button loading={isSaving} type="submit">
              {isCreating
                ? t("family.create")
                : t("common.save")}
            </Button>
            {isCreating ? (
              <Button
                onClick={onCancelCreate}
                type="button"
                variant="subtle"
              >
                {t("common.cancel")}
              </Button>
            ) : (
              <Button
                onClick={
                  selectedMember?.active
                    ? onArchiveOpen
                    : onRestoreOpen
                }
                type="button"
                variant={
                  selectedMember?.active ? "danger" : "secondary"
                }
              >
                {selectedMember?.active
                  ? t("common.archive")
                  : t("family.restoreMember")}
              </Button>
            )}
          </div>
        </form>
      </div>

      <ConfirmAction
        confirmLabel={t("common.archive")}
        loading={isArchiving}
        message={t("confirmations.archiveMember")}
        onCancel={onArchiveCancel}
        onConfirm={onArchiveConfirm}
        open={isArchiveConfirmOpen}
        title={t("family.archiveMember")}
      />
      <ConfirmAction
        confirmLabel={t("family.restoreMember")}
        loading={isArchiving}
        message={t("confirmations.restoreMember")}
        onCancel={onRestoreCancel}
        onConfirm={onRestoreConfirm}
        open={isRestoreConfirmOpen}
        title={t("family.restoreMember")}
      />
    </>
  );
}
