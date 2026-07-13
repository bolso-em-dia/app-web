import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth/useAuth";
import { useI18n } from "../app/i18n/I18nContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import FormError from "../components/ui/FormError";
import Input from "../components/ui/Input";
import { createLoginSchema, type LoginFormValues } from "../lib/validation/loginSchema";
import styles from "./LoginPage.module.scss";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useI18n();
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);

    try {
      await login(values.email, values.password);
      navigate("/", { replace: true });
    } catch {
      setError(t("login.error"));
    }
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>{t("app.brand")}</span>
          <h1 className={styles.title}>{t("login.title")}</h1>
          <p className={styles.subtitle}>{t("login.subtitle")}</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label={t("common.email")} error={errors.email?.message} htmlFor="email">
            <Input id="email" type="email" autoComplete="email" hasError={Boolean(errors.email)} {...register("email")} />
          </Field>

          <Field label={t("family.password")} error={errors.password?.message} htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              hasError={Boolean(errors.password)}
              {...register("password")}
            />
          </Field>

          <FormError>{error}</FormError>

          <Button className={styles.submit} type="submit" loading={isSubmitting} fullWidth>
            {t("login.submit")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
