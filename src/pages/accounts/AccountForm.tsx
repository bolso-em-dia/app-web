import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  archiveAccount,
  createAccount,
  updateAccount,
  type Account,
  type AccountPayload,
} from "../../app/api/accounts";
import type { AuthUser } from "../../app/api/auth";
import { useAuth } from "../../app/auth/useAuth";
import Button from "../../components/ui/Button";
import ColorSwatchSelect from "../../components/ui/ColorSwatchSelect";
import ConfirmAction from "../../components/ui/ConfirmAction";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import {
  createAccountSchema,
  type AccountFormValues,
} from "../../lib/validation/accountSchema";
import { useI18n } from "../../app/i18n/I18nContext";
import { COLOR_OPTIONS, getColorLabel } from "../../lib/uiOptions";
import styles from "./AccountsPage.module.scss";

const DEFAULT_VALUES: AccountFormValues = {
  name: "",
  type: "CHECKING",
  currency: "BRL",
  brand: "",
  color: "",
  closingDay: undefined,
  dueDay: undefined,
};

function mapFormValuesToPayload(values: AccountFormValues): AccountPayload {
  return {
    name: values.name,
    type: values.type,
    currency: values.currency,
    brand: values.brand || undefined,
    color: values.color || undefined,
    closingDay: values.type === "CREDIT_CARD" ? values.closingDay : undefined,
    dueDay: values.type === "CREDIT_CARD" ? values.dueDay : undefined,
  };
}

interface AccountFormProps {
  initialValues: AccountFormValues | null;
  editingAccountId: string | null;
  editingAccount: Account | null;
  user: AuthUser;
  onSuccess: () => void;
  onRefresh: () => void;
  onCancel: () => void;
}

export default function AccountForm({
  initialValues,
  editingAccountId,
  editingAccount,
  user,
  onSuccess,
  onRefresh,
  onCancel,
}: AccountFormProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();

  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archivedFromMonth, setArchivedFromMonth] = useState<string | null>(
    editingAccount?.archivedFromMonth ?? null,
  );

  const showForeignCurrency = user.preferences.showForeignCurrency ?? false;
  const isCreating = editingAccountId === null;

  const accountSchema = useMemo(() => createAccountSchema(t), [t]);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const initialValuesKey = JSON.stringify(initialValues);
  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
      setArchivedFromMonth(editingAccount?.archivedFromMonth ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValuesKey, editingAccountId]);

  const onSubmit = useCallback(
    async (values: AccountFormValues) => {
      if (!accessToken) {
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        if (editingAccountId) {
          await updateAccount(
            editingAccountId,
            mapFormValuesToPayload(values),
            accessToken,
          );
        } else {
          await createAccount(
            mapFormValuesToPayload(values),
            accessToken,
          );
        }
        onSuccess();
      } catch {
        setError(t("accounts.saveError"));
      } finally {
        setIsSaving(false);
      }
    },
    [accessToken, editingAccountId, onSuccess, t],
  );

  const onArchive = useCallback(async () => {
    if (!accessToken || !editingAccountId || archivedFromMonth) {
      return;
    }

    setIsArchiveConfirmOpen(false);
    setIsArchiving(true);
    setError(null);

    try {
      const archived = await archiveAccount(editingAccountId, accessToken);
      setArchivedFromMonth(archived.archivedFromMonth);
      onRefresh();
    } catch {
      setError(t("accounts.archiveError"));
    } finally {
      setIsArchiving(false);
    }
  }, [accessToken, archivedFromMonth, editingAccountId, onRefresh, t]);

  if (!initialValues) {
    return null;
  }

  const accountType = form.watch("type");
  const colorValue = form.watch("color");
  const isCreditCard = accountType === "CREDIT_CARD";

  return (
    <>
      <form
        className={styles.form}
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Field
          error={form.formState.errors.name?.message}
          htmlFor="account-name"
          label={t("common.name")}
        >
          <Input
            id="account-name"
            {...form.register("name")}
            hasError={Boolean(form.formState.errors.name)}
            placeholder={t("accounts.placeholder")}
          />
        </Field>

        <div className={styles.typeGrid}>
          <Field
            error={form.formState.errors.type?.message}
            htmlFor="account-type"
            label={t("common.type")}
          >
            <Select
              id="account-type"
              {...form.register("type")}
              hasError={Boolean(form.formState.errors.type)}
            >
              <option value="CHECKING">{t("accountTypes.CHECKING")}</option>
              <option value="SAVINGS">{t("accountTypes.SAVINGS")}</option>
              <option value="CREDIT_CARD">
                {t("accountTypes.CREDIT_CARD")}
              </option>
              <option value="INVESTMENT">{t("accountTypes.INVESTMENT")}</option>
            </Select>
          </Field>

          {showForeignCurrency ? (
            <Field htmlFor="account-currency" label={t("accounts.currency")}>
              <Select id="account-currency" {...form.register("currency")}>
                <option value="BRL">Real (BRL)</option>
                <option value="USD">Dólar (USD)</option>
              </Select>
            </Field>
          ) : null}

          <Field
            error={form.formState.errors.color?.message}
            htmlFor="account-color"
            label={t("accounts.color")}
          >
            <ColorSwatchSelect
              clearLabel={t("common.clearSelection")}
              id="account-color"
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
        </div>

        {isCreditCard ? (
          <div className={styles.cardFields}>
            <Field
              error={form.formState.errors.brand?.message}
              htmlFor="account-brand"
              label={t("accounts.brand")}
            >
              <Input
                id="account-brand"
                {...form.register("brand")}
                hasError={Boolean(form.formState.errors.brand)}
                placeholder={t("accounts.brand")}
              />
            </Field>

            <Field
              error={form.formState.errors.closingDay?.message}
              htmlFor="account-closing-day"
              label={t("accounts.closingDay")}
            >
              <Input
                id="account-closing-day"
                {...form.register("closingDay")}
                hasError={Boolean(form.formState.errors.closingDay)}
                inputMode="numeric"
                max={31}
                min={1}
                type="number"
              />
            </Field>

            <Field
              error={form.formState.errors.dueDay?.message}
              htmlFor="account-due-day"
              label={t("accounts.dueDay")}
            >
              <Input
                id="account-due-day"
                {...form.register("dueDay")}
                hasError={Boolean(form.formState.errors.dueDay)}
                inputMode="numeric"
                max={31}
                min={1}
                type="number"
              />
            </Field>
          </div>
        ) : null}

        {colorValue ? (
          <div className={styles.swatch}>
            <span
              className={styles.swatchDot}
              style={{ backgroundColor: colorValue }}
            />
            <span>
              {getColorLabel(colorValue) || t("common.clearSelection")}
            </span>
          </div>
        ) : null}

        <FormError>{error}</FormError>

        <div className={styles.formActions}>
          <Button disabled={isSaving} type="submit">
            {isCreating ? t("accounts.create") : t("common.save")}
          </Button>
          {isCreating ? (
            <Button onClick={onCancel} type="button" variant="subtle">
              {t("common.cancel")}
            </Button>
          ) : (
            <Button
              disabled={Boolean(archivedFromMonth)}
              onClick={() => setIsArchiveConfirmOpen(true)}
              type="button"
              variant={archivedFromMonth ? "subtle" : "danger"}
            >
              {archivedFromMonth
                ? t("accounts.archived")
                : t("common.archive")}
            </Button>
          )}
        </div>
      </form>

      <ConfirmAction
        confirmLabel={t("common.archive")}
        loading={isArchiving}
        message={t("confirmations.archiveAccount")}
        onCancel={() => setIsArchiveConfirmOpen(false)}
        onConfirm={onArchive}
        open={isArchiveConfirmOpen}
        title={t("accounts.archiveTitle")}
      />
    </>
  );
}
