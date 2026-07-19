import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { changePassword } from "../app/api/auth";
import { useAuth } from "../app/auth/useAuth";
import { useI18n } from "../app/i18n/I18nContext";
import Button from "./ui/Button";
import Field from "./ui/Field";
import FormError from "./ui/FormError";
import Input from "./ui/Input";
import { formErrorFrom } from "../lib/formError";
import styles from "./PasswordChangeForm.module.scss";

type PasswordChangeFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  successMessage?: string;
  onSuccess?: () => void;
};

type PasswordChangeFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function createPasswordChangeSchema(t: ReturnType<typeof useI18n>["t"]) {
  return z
    .object({
      currentPassword: z.string().min(8, t("validation.passwordMin8")).max(72, t("validation.passwordMax72")),
      newPassword: z.string().min(8, t("validation.passwordMin8")).max(72, t("validation.passwordMax72")),
      confirmPassword: z.string().min(8, t("validation.passwordMin8")).max(72, t("validation.passwordMax72")),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      message: t("settings.password.confirmationMismatch"),
      path: ["confirmPassword"],
    });
}

export default function PasswordChangeForm({ title, subtitle, submitLabel, successMessage, onSuccess }: PasswordChangeFormProps) {
  const { accessToken, updateUser } = useAuth();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const schema = useMemo(() => createPasswordChangeSchema(t), [t]);
  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: PasswordChangeFormValues) {
    if (!accessToken) {
      setError(t("common.sessionExpired"));
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await changePassword(values, accessToken);
      updateUser(updatedUser);
      form.reset();
      if (successMessage) {
        setSuccess(successMessage);
      }
      onSuccess?.();
    } catch (submitError) {
      console.error("Failed to change password.", submitError);
      setError(formErrorFrom(submitError, "settings.password.saveError", t));
    }
  }

  return (
    <form className={styles.form} noValidate onSubmit={form.handleSubmit((values) => void onSubmit(values))}>
      <div className={styles.intro}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <Field error={form.formState.errors.currentPassword?.message} htmlFor="current-password" label={t("settings.password.current")}>
        <Input
          autoComplete="current-password"
          hasError={Boolean(form.formState.errors.currentPassword)}
          id="current-password"
          type="password"
          {...form.register("currentPassword")}
        />
      </Field>

      <Field error={form.formState.errors.newPassword?.message} htmlFor="new-password" label={t("settings.password.new")}>
        <Input
          autoComplete="new-password"
          hasError={Boolean(form.formState.errors.newPassword)}
          id="new-password"
          type="password"
          {...form.register("newPassword")}
        />
      </Field>

      <Field error={form.formState.errors.confirmPassword?.message} htmlFor="confirm-password" label={t("settings.password.confirm")}>
        <Input
          autoComplete="new-password"
          hasError={Boolean(form.formState.errors.confirmPassword)}
          id="confirm-password"
          type="password"
          {...form.register("confirmPassword")}
        />
      </Field>

      {success ? <p className={styles.successMessage}>{success}</p> : null}
      <FormError>{error}</FormError>

      <div className={styles.actions}>
        <Button loading={form.formState.isSubmitting} type="submit">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
