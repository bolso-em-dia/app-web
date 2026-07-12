import type { UseFormReturn } from "react-hook-form";
import Button from "../../components/ui/Button";
import ColorSwatchSelect from "../../components/ui/ColorSwatchSelect";
import ConfirmAction from "../../components/ui/ConfirmAction";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { COLOR_OPTIONS, getColorLabel } from "../../lib/uiOptions";
import type { AccountFormValues } from "../../lib/validation/accountSchema";
import type { Account } from "../../app/api/accounts";
import { useI18n } from "../../app/i18n/I18nContext";
import styles from "./AccountsPage.module.scss";

interface AccountFormProps {
  form: UseFormReturn<AccountFormValues>;
  isCreating: boolean;
  isSaving: boolean;
  isArchiving: boolean;
  isArchiveConfirmOpen: boolean;
  error: string | null;
  showForeignCurrency: boolean;
  selectedAccount: Account | null;
  onCancelCreate: () => void;
  onSubmit: (values: AccountFormValues) => void;
  onArchiveOpen: () => void;
  onArchiveCancel: () => void;
  onArchiveConfirm: () => void;
}

export default function AccountForm({
  form,
  isCreating,
  isSaving,
  isArchiving,
  isArchiveConfirmOpen,
  error,
  showForeignCurrency,
  selectedAccount,
  onCancelCreate,
  onSubmit,
  onArchiveOpen,
  onArchiveCancel,
  onArchiveConfirm,
}: AccountFormProps) {
  const { t } = useI18n();
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
              <option value="CHECKING">
                {t("accountTypes.CHECKING")}
              </option>
              <option value="SAVINGS">
                {t("accountTypes.SAVINGS")}
              </option>
              <option value="CREDIT_CARD">
                {t("accountTypes.CREDIT_CARD")}
              </option>
              <option value="INVESTMENT">
                {t("accountTypes.INVESTMENT")}
              </option>
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
              {getColorLabel(colorValue) ||
                t("common.clearSelection")}
            </span>
          </div>
        ) : null}

        <FormError>{error}</FormError>

        <div className={styles.formActions}>
          <Button disabled={isSaving} type="submit">
            {isCreating
              ? t("accounts.create")
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
              disabled={
                Boolean(selectedAccount?.archivedFromMonth)
              }
              onClick={onArchiveOpen}
              type="button"
              variant={
                selectedAccount?.archivedFromMonth
                  ? "subtle"
                  : "danger"
              }
            >
              {selectedAccount?.archivedFromMonth
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
        onCancel={onArchiveCancel}
        onConfirm={onArchiveConfirm}
        open={isArchiveConfirmOpen}
        title={t("accounts.archiveTitle")}
      />
    </>
  );
}
