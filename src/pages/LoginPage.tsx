import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth/useAuth";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import FormError from "../components/ui/FormError";
import Input from "../components/ui/Input";
import {
  loginSchema,
  type LoginFormValues,
} from "../lib/validation/loginSchema";
import styles from "./LoginPage.module.scss";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@my-money.local",
      password: "admin123456",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);

    try {
      await login(values.email, values.password);
      navigate("/", { replace: true });
    } catch {
      setError("Unable to sign in. Check your email and password.");
    }
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>My Money</span>
          <h1 className={styles.title}>Sign in</h1>
          <p className={styles.subtitle}>
            Use the initial administrative account to access the system.
          </p>
        </div>

        <form
          className={styles.form}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Field label="Email" error={errors.email?.message} htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              hasError={Boolean(errors.email)}
              {...register("email")}
            />
          </Field>

          <Field
            label="Password"
            error={errors.password?.message}
            htmlFor="password"
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              hasError={Boolean(errors.password)}
              {...register("password")}
            />
          </Field>

          <FormError>{error}</FormError>

          <Button
            className={styles.submit}
            type="submit"
            loading={isSubmitting}
            fullWidth
          >
            Sign in
          </Button>
        </form>
      </Card>
    </div>
  );
}
