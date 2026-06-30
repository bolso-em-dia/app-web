import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  archiveAccount,
  createAccount,
  listAccounts,
  type Account,
  type AccountPayload,
  updateAccount,
} from "../../app/api/accounts";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import {
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import {
  accountSchema,
  archiveAccountSchema,
  type AccountFormValues,
  type ArchiveAccountFormValues,
} from "../../lib/validation/accountSchema";
import styles from "./AccountsPage.module.scss";

const DEFAULT_VALUES: AccountFormValues = {
  name: "",
  type: "CHECKING",
  brand: "",
  color: "",
  closingDay: undefined,
  dueDay: undefined,
};

const ACCOUNT_TYPE_LABELS: Record<Account["type"], string> = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  CREDIT_CARD: "Credit card",
  INVESTMENT: "Investment",
};

function toMonthInputValue(value: string) {
  return value.slice(0, 7);
}

function fromMonthInputValue(value: string) {
  return `${value}-01`;
}

function mapFormValuesToPayload(values: AccountFormValues): AccountPayload {
  return {
    name: values.name,
    type: values.type,
    brand: values.brand || undefined,
    color: values.color || undefined,
    closingDay: values.type === "CREDIT_CARD" ? values.closingDay : undefined,
    dueDay: values.type === "CREDIT_CARD" ? values.dueDay : undefined,
  };
}

export default function AccountsPage() {
  const { accessToken } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedId) ?? null,
    [accounts, selectedId],
  );

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const archiveForm = useForm<ArchiveAccountFormValues>({
    resolver: zodResolver(archiveAccountSchema),
    defaultValues: {
      archivedFromMonth: getCurrentReferenceMonth(),
    },
  });

  const accountType = form.watch("type");
  const isCreditCard = accountType === "CREDIT_CARD";

  const loadAccounts = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await listAccounts(accessToken);
      setAccounts(response);

      if (response.length > 0) {
        setSelectedId((current) =>
          current && response.some((account) => account.id === current)
            ? current
            : response[0].id,
        );
      } else {
        setSelectedId(null);
      }
    } catch {
      setError("Unable to load accounts.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (isCreating) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (selectedAccount) {
      form.reset({
        name: selectedAccount.name,
        type: selectedAccount.type,
        brand: selectedAccount.brand ?? "",
        color: selectedAccount.color ?? "",
        closingDay: selectedAccount.closingDay ?? undefined,
        dueDay: selectedAccount.dueDay ?? undefined,
      });
    }
  }, [form, isCreating, selectedAccount]);

  useEffect(() => {
    archiveForm.reset({
      archivedFromMonth: toMonthInputValue(
        selectedAccount?.archivedFromMonth ?? getCurrentReferenceMonth(),
      ),
    });
  }, [archiveForm, selectedAccount]);

  async function onSubmit(values: AccountFormValues) {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        const created = await createAccount(
          mapFormValuesToPayload(values),
          accessToken,
        );
        setAccounts((current) => [created, ...current]);
        setSelectedId(created.id);
        setIsCreating(false);
      } else if (selectedAccount) {
        const updated = await updateAccount(
          selectedAccount.id,
          mapFormValuesToPayload(values),
          accessToken,
        );
        setAccounts((current) =>
          current.map((account) =>
            account.id === updated.id ? updated : account,
          ),
        );
      }
    } catch {
      setError("Unable to save the account.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onArchive(values: ArchiveAccountFormValues) {
    if (!accessToken || !selectedAccount || selectedAccount.archivedFromMonth) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      const archived = await archiveAccount(
        selectedAccount.id,
        {
          archivedFromMonth: fromMonthInputValue(values.archivedFromMonth),
        },
        accessToken,
      );
      setAccounts((current) =>
        current.map((account) =>
          account.id === archived.id ? archived : account,
        ),
      );
    } catch {
      setError("Unable to archive the account.");
    } finally {
      setIsArchiving(false);
    }
  }

  function handleStartCreate() {
    setIsCreating(true);
    setSelectedId(null);
    setError(null);
  }

  function handleCancelCreate() {
    setIsCreating(false);
    setError(null);
    if (accounts[0]) {
      setSelectedId(accounts[0].id);
    }
  }

  return (
    <AppShell
      title="Accounts"
      subtitle="Manage bank accounts, investments, and credit cards."
      actions={
        <Button onClick={handleStartCreate} type="button">
          New account
        </Button>
      }
    >
      {isLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label="Loading accounts" />
        </Card>
      ) : (
        <section className={styles.layout}>
          <Card className={styles.listPanel}>
            <div className={styles.listHeader}>
              <h2 className={styles.panelTitle}>Accounts</h2>
              <span className={styles.count}>{accounts.length}</span>
            </div>

            <div className={styles.accountList}>
              {accounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  className={
                    account.id === selectedId && !isCreating
                      ? `${styles.accountItem} ${styles.accountItemActive}`
                      : styles.accountItem
                  }
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedId(account.id);
                    setError(null);
                  }}
                >
                  <div>
                    <strong>{account.name}</strong>
                    <p className={styles.accountMeta}>
                      {ACCOUNT_TYPE_LABELS[account.type]}
                      {account.brand ? ` · ${account.brand}` : ""}
                      {account.closingDay && account.dueDay
                        ? ` · Closes ${account.closingDay} · Due ${account.dueDay}`
                        : ""}
                    </p>
                  </div>
                  <div className={styles.accountBadges}>
                    <span className={styles.badge}>
                      {ACCOUNT_TYPE_LABELS[account.type]}
                    </span>
                    {account.archivedFromMonth ? (
                      <span className={`${styles.badge} ${styles.badgeMuted}`}>
                        Archived from{" "}
                        {formatReferenceMonth(account.archivedFromMonth)}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className={styles.sidePanels}>
            <Card className={styles.formPanel}>
              <div className={styles.formHeader}>
                <div>
                  <h2 className={styles.panelTitle}>
                    {isCreating ? "New account" : "Account details"}
                  </h2>
                  <p className={styles.formSubtitle}>
                    {isCreating
                      ? "Add a new financial account or card."
                      : "Update account details and card settings."}
                  </p>
                </div>
              </div>

              <form
                className={styles.form}
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <Field
                  label="Name"
                  htmlFor="account-name"
                  error={form.formState.errors.name?.message}
                >
                  <Input
                    id="account-name"
                    {...form.register("name")}
                    hasError={Boolean(form.formState.errors.name)}
                    placeholder="Main checking"
                  />
                </Field>

                <div className={styles.typeGrid}>
                  <Field
                    label="Type"
                    htmlFor="account-type"
                    error={form.formState.errors.type?.message}
                  >
                    <Select
                      id="account-type"
                      {...form.register("type")}
                      hasError={Boolean(form.formState.errors.type)}
                    >
                      <option value="CHECKING">Checking</option>
                      <option value="SAVINGS">Savings</option>
                      <option value="CREDIT_CARD">Credit card</option>
                      <option value="INVESTMENT">Investment</option>
                    </Select>
                  </Field>

                  <Field
                    label="Color"
                    htmlFor="account-color"
                    error={form.formState.errors.color?.message}
                  >
                    <Input
                      id="account-color"
                      {...form.register("color")}
                      hasError={Boolean(form.formState.errors.color)}
                      placeholder="#2254d1"
                    />
                  </Field>
                </div>

                {isCreditCard ? (
                  <div className={styles.cardFields}>
                    <Field
                      label="Brand"
                      htmlFor="account-brand"
                      error={form.formState.errors.brand?.message}
                    >
                      <Input
                        id="account-brand"
                        {...form.register("brand")}
                        hasError={Boolean(form.formState.errors.brand)}
                        placeholder="Visa"
                      />
                    </Field>

                    <Field
                      label="Closing day"
                      htmlFor="account-closing-day"
                      error={form.formState.errors.closingDay?.message}
                    >
                      <Input
                        id="account-closing-day"
                        {...form.register("closingDay")}
                        hasError={Boolean(form.formState.errors.closingDay)}
                        inputMode="numeric"
                        min={1}
                        max={31}
                        type="number"
                      />
                    </Field>

                    <Field
                      label="Due day"
                      htmlFor="account-due-day"
                      error={form.formState.errors.dueDay?.message}
                    >
                      <Input
                        id="account-due-day"
                        {...form.register("dueDay")}
                        hasError={Boolean(form.formState.errors.dueDay)}
                        inputMode="numeric"
                        min={1}
                        max={31}
                        type="number"
                      />
                    </Field>
                  </div>
                ) : null}

                {form.watch("color") ? (
                  <div className={styles.swatch}>
                    <span
                      className={styles.swatchDot}
                      style={{ backgroundColor: form.watch("color") }}
                    />
                    <span>{form.watch("color")}</span>
                  </div>
                ) : null}

                <FormError>{error}</FormError>

                <div className={styles.formActions}>
                  <Button disabled={isSaving} type="submit">
                    {isCreating ? "Create account" : "Save changes"}
                  </Button>
                  {isCreating ? (
                    <Button
                      onClick={handleCancelCreate}
                      type="button"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </form>
            </Card>

            {selectedAccount &&
            !selectedAccount.archivedFromMonth &&
            !isCreating ? (
              <Card className={styles.archivePanel}>
                <div className={styles.formHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Archive account</h2>
                    <p className={styles.formSubtitle}>
                      Stop using this account from a specific month onward.
                    </p>
                  </div>
                </div>

                <form
                  className={styles.form}
                  onSubmit={archiveForm.handleSubmit(onArchive)}
                >
                  <Field
                    label="Archive month"
                    htmlFor="account-archive-month"
                    error={
                      archiveForm.formState.errors.archivedFromMonth?.message
                    }
                  >
                    <Input
                      id="account-archive-month"
                      {...archiveForm.register("archivedFromMonth")}
                      hasError={Boolean(
                        archiveForm.formState.errors.archivedFromMonth,
                      )}
                      type="month"
                    />
                  </Field>

                  <Button
                    disabled={isArchiving}
                    type="submit"
                    variant="secondary"
                  >
                    Archive account
                  </Button>
                </form>
              </Card>
            ) : null}
          </div>
        </section>
      )}
    </AppShell>
  );
}
