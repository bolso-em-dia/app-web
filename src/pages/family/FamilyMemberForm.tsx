import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  archiveFamilyMember,
  createFamilyMember,
  restoreFamilyMember,
  type FamilyMember,
  type FamilyRole,
  updateFamilyMember,
} from "../../app/api/family";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import Button from "../../components/ui/Button";
import Checkbox from "../../components/ui/Checkbox";
import ConfirmAction from "../../components/ui/ConfirmAction";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import {
  createFamilyMemberSchema as buildCreateFamilyMemberSchema,
  type CreateFamilyMemberFormValues,
  type UpdateFamilyMemberFormValues,
  createUpdateFamilyMemberSchema,
} from "../../lib/validation/familyMemberSchema";
import styles from "./FamilyPage.module.scss";

type FamilyMemberFormValues = CreateFamilyMemberFormValues | UpdateFamilyMemberFormValues;

const CREATE_DEFAULT_VALUES: CreateFamilyMemberFormValues = {
  name: "",
  email: "",
  password: "",
  role: "USER",
  allowanceEnabled: false,
};

type FamilyMemberFormProps = {
  member: FamilyMember | null;
  onSuccess: () => void;
  onCancel: () => void;
};

function buildInitialValues(member: FamilyMember | null): FamilyMemberFormValues {
  if (!member) {
    return CREATE_DEFAULT_VALUES;
  }

  return {
    name: member.name,
    email: member.email,
    password: "",
    role: member.role,
    allowanceEnabled: member.allowanceEnabled,
  };
}

export default function FamilyMemberForm({ member, onSuccess, onCancel }: FamilyMemberFormProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreating = member === null;
  const initialValues = useMemo(() => buildInitialValues(member), [member]);

  const createFamilyMemberSchema = useMemo(() => buildCreateFamilyMemberSchema(t), [t]);
  const updateFamilyMemberSchema = useMemo(() => createUpdateFamilyMemberSchema(t), [t]);

  const form = useForm<FamilyMemberFormValues>({
    resolver: zodResolver(isCreating ? createFamilyMemberSchema : updateFamilyMemberSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form]);

  async function onSubmit(values: FamilyMemberFormValues) {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        await createFamilyMember(
          {
            name: values.name,
            email: values.email,
            password: values.password,
            role: values.role as FamilyRole,
            allowanceEnabled: values.allowanceEnabled,
          },
          accessToken,
        );
      } else if (member) {
        await updateFamilyMember(
          member.id,
          {
            name: values.name,
            email: values.email,
            password: values.password || undefined,
            role: values.role as FamilyRole,
            allowanceEnabled: values.allowanceEnabled,
          },
          accessToken,
        );
      }
      onSuccess();
    } catch {
      setError(t("family.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchiveToggle() {
    if (!accessToken || !member) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      if (member.active) {
        await archiveFamilyMember(member.id, accessToken);
      } else {
        await restoreFamilyMember(member.id, accessToken);
      }
      onSuccess();
    } catch {
      setError(t("family.statusError"));
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <>
      <div className={styles.drawerStack}>
        <form className={styles.form} onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Field error={form.formState.errors.name?.message} htmlFor="family-name" label={t("common.name")}>
            <Input id="family-name" hasError={Boolean(form.formState.errors.name)} {...form.register("name")} />
          </Field>

          <Field error={form.formState.errors.email?.message} htmlFor="family-email" label={t("common.email")}>
            <Input id="family-email" hasError={Boolean(form.formState.errors.email)} type="email" {...form.register("email")} />
          </Field>

          <Field
            error={form.formState.errors.password?.message}
            htmlFor="family-password"
            label={isCreating ? t("family.password") : t("family.passwordOptional")}
          >
            <Input id="family-password" hasError={Boolean(form.formState.errors.password)} type="password" {...form.register("password")} />
          </Field>

          <Field error={form.formState.errors.role?.message} htmlFor="family-role" label={t("common.role")}>
            <Select id="family-role" hasError={Boolean(form.formState.errors.role)} {...form.register("role")}>
              <option value="USER">{t("roles.USER")}</option>
              <option value="ADMIN">{t("roles.ADMIN")}</option>
            </Select>
          </Field>

          <Checkbox label={t("family.allowanceEnabled")} {...form.register("allowanceEnabled")} />

          <FormError>{error}</FormError>

          <div className={styles.formActions}>
            <Button loading={isSaving} type="submit">
              {isCreating ? t("family.create") : t("common.save")}
            </Button>
            {isCreating ? (
              <Button onClick={onCancel} type="button" variant="subtle">
                {t("common.cancel")}
              </Button>
            ) : (
              <Button
                onClick={member?.active ? () => setIsArchiveConfirmOpen(true) : () => setIsRestoreConfirmOpen(true)}
                type="button"
                variant={member?.active ? "danger" : "secondary"}
              >
                {member?.active ? t("common.archive") : t("family.restoreMember")}
              </Button>
            )}
          </div>
        </form>
      </div>

      <ConfirmAction
        confirmLabel={t("common.archive")}
        loading={isArchiving}
        message={t("confirmations.archiveMember")}
        onCancel={() => setIsArchiveConfirmOpen(false)}
        onConfirm={() => {
          setIsArchiveConfirmOpen(false);
          void handleArchiveToggle();
        }}
        open={isArchiveConfirmOpen}
        title={t("family.archiveMember")}
      />
      <ConfirmAction
        confirmLabel={t("family.restoreMember")}
        loading={isArchiving}
        message={t("confirmations.restoreMember")}
        onCancel={() => setIsRestoreConfirmOpen(false)}
        onConfirm={() => {
          setIsRestoreConfirmOpen(false);
          void handleArchiveToggle();
        }}
        open={isRestoreConfirmOpen}
        title={t("family.restoreMember")}
      />
    </>
  );
}
