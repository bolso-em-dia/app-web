import { DollarSign, Landmark, Languages, WalletCards } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { listAccountOptions, type AccountOption } from "../../app/api/accounts";
import { updateCurrentUserPreferences, type UserPreferences } from "../../app/api/userPreferences";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import PasswordChangeForm from "../../components/PasswordChangeForm";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import FormError from "../../components/ui/FormError";
import Select from "../../components/ui/Select";
import Switch from "../../components/ui/Switch";
import Tooltip from "../../components/ui/Tooltip";
import { getCurrentReferenceMonth } from "../../lib/formatters/date";
import { formErrorFrom } from "../../lib/formError";
import styles from "./UserSettingsPage.module.scss";

type UserSettingsFormValues = {
  defaultAccountId: string;
  locale: UserPreferences["locale"];
  showBalanceWithBudgets: boolean;
  showForeignCurrency: boolean;
};

function mapPreferencesToFormValues(preferences: UserPreferences | undefined): UserSettingsFormValues {
  return {
    defaultAccountId: preferences?.defaultAccountId ?? "",
    locale: preferences?.locale ?? "pt-BR",
    showBalanceWithBudgets: preferences?.showBalanceWithBudgets ?? false,
    showForeignCurrency: preferences?.showForeignCurrency ?? false,
  };
}

type SettingFieldHeaderProps = {
  icon: typeof Landmark;
  label: string;
  tooltip: string;
};

function SettingFieldHeader({ icon: Icon, label, tooltip }: SettingFieldHeaderProps) {
  return (
    <div className={styles.fieldHeader}>
      <div className={styles.fieldTitleWrap}>
        <Icon aria-hidden="true" className={styles.fieldIcon} />
        <span className={styles.fieldTitle}>{label}</span>
      </div>
      <Tooltip content={tooltip} />
    </div>
  );
}

export default function UserSettingsPage() {
  const { accessToken, user, updateUserPreferences: applyUserPreferences } = useAuth();
  const { t } = useI18n();
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentPreferences = user?.preferences;
  const formDefaultValues = useMemo(() => mapPreferencesToFormValues(currentPreferences), [currentPreferences]);
  const formKey = [
    formDefaultValues.defaultAccountId,
    formDefaultValues.locale,
    formDefaultValues.showBalanceWithBudgets,
    formDefaultValues.showForeignCurrency,
  ].join("|");

  const loadPageData = useCallback(async () => {
    if (!accessToken) {
      setError(t("common.sessionExpired"));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accounts = await listAccountOptions(getCurrentReferenceMonth(), accessToken);
      setAccountOptions(accounts);
    } catch (loadError) {
      console.error("Failed to load user settings reference data.", loadError);
      setError(t("settings.error"));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  async function onSubmit(values: UserSettingsFormValues) {
    if (!accessToken) {
      setError(t("common.sessionExpired"));
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await updateCurrentUserPreferences(
        {
          defaultAccountId: values.defaultAccountId || null,
          locale: values.locale,
          showBalanceWithBudgets: values.showBalanceWithBudgets,
          showForeignCurrency: values.showForeignCurrency,
        },
        accessToken,
      );
      applyUserPreferences(updated);
      setSuccessMessage(t("settings.saveSuccess"));
    } catch (submitError) {
      console.error("Failed to save user settings.", submitError);
      setError(formErrorFrom(submitError, "settings.saveError", t));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title={t("settings.title")}>
      {isLoading ? (
        <Card className={styles.feedbackCard}>
          <Spinner label={t("settings.loading")} />
        </Card>
      ) : null}

      {!isLoading ? (
        <div className={styles.stack}>
          <Card className={styles.formCard}>
            <UserSettingsPreferencesForm
              key={formKey}
              accountOptions={accountOptions}
              defaultValues={formDefaultValues}
              error={error}
              isSaving={isSaving}
              onSubmit={onSubmit}
              successMessage={successMessage}
            />
          </Card>

          <Card className={styles.formCard}>
            <PasswordChangeForm
              submitLabel={t("common.save")}
              subtitle={t("settings.password.subtitle")}
              successMessage={t("settings.password.success")}
              title={t("settings.password.title")}
            />
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}

type UserSettingsPreferencesFormProps = {
  accountOptions: AccountOption[];
  defaultValues: UserSettingsFormValues;
  error: string | null;
  isSaving: boolean;
  onSubmit: (values: UserSettingsFormValues) => Promise<void>;
  successMessage: string | null;
};

function UserSettingsPreferencesForm({
  accountOptions,
  defaultValues,
  error,
  isSaving,
  onSubmit,
  successMessage,
}: UserSettingsPreferencesFormProps) {
  const { t } = useI18n();
  const form = useForm<UserSettingsFormValues>({
    defaultValues,
  });

  const showBalanceWithBudgets = useWatch({ control: form.control, name: "showBalanceWithBudgets" });
  const showForeignCurrency = useWatch({ control: form.control, name: "showForeignCurrency" });

  return (
    <form className={styles.form} noValidate onSubmit={form.handleSubmit((values) => void onSubmit(values))}>
      <div className={styles.formIntro}>
        <h2 className={styles.formTitle}>{t("settings.formTitle")}</h2>
        <p className={styles.formSubtitle}>{t("settings.formSubtitle")}</p>
      </div>

      <div className={styles.fieldGroup}>
        <SettingFieldHeader icon={Landmark} label={t("settings.account.label")} tooltip={t("settings.account.description")} />
        <Select aria-label={t("settings.account.label")} id="defaultAccountId" {...form.register("defaultAccountId")}>
          <option value="">{t("settings.account.empty")}</option>
          {accountOptions.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
      </div>

      <div className={styles.fieldGroup}>
        <SettingFieldHeader icon={Languages} label={t("settings.locale.label")} tooltip={t("settings.locale.description")} />
        <Select aria-label={t("settings.locale.label")} id="locale" {...form.register("locale")}>
          <option value="pt-BR">{t("settings.locale.pt-BR")}</option>
          <option value="en-US">{t("settings.locale.en-US")}</option>
        </Select>
      </div>

      <div className={styles.fieldGroup}>
        <SettingFieldHeader icon={WalletCards} label={t("settings.balance.label")} tooltip={t("settings.balance.description")} />
        <Switch
          id="showBalanceWithBudgets"
          checked={showBalanceWithBudgets}
          label={t("settings.balance.withBudgets")}
          onChange={(event) => form.setValue("showBalanceWithBudgets", event.currentTarget.checked)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <SettingFieldHeader
          icon={DollarSign}
          label={t("settings.foreignCurrency.label")}
          tooltip={t("settings.foreignCurrency.description")}
        />
        <Switch
          id="showForeignCurrency"
          checked={showForeignCurrency}
          label={showForeignCurrency ? t("settings.foreignCurrency.enabled") : t("settings.foreignCurrency.disabled")}
          onChange={(event) => form.setValue("showForeignCurrency", event.currentTarget.checked)}
        />
      </div>

      {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}
      <FormError>{error}</FormError>

      <div className={styles.formActions}>
        <Button loading={isSaving} type="submit">
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
