import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  archiveAccount,
  createAccount,
  getAccountById,
  listAccountPage,
  type Account,
  type AccountListParams,
  type AccountPayload,
  type AccountType,
  updateAccount,
} from "../../app/api/accounts";
import { useAuth } from "../../app/auth/useAuth";
import Spinner from "../../components/feedback/Spinner";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
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
const DEFAULT_PAGE_SIZE = 12;

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ALL");
  const [typeFilter, setTypeFilter] = useState<"" | AccountType>("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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
  const colorValue = form.watch("color");
  const isCreditCard = accountType === "CREDIT_CARD";

  const loadAccounts = useCallback(
    async (params: AccountListParams) => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await listAccountPage(params, accessToken);
        setAccounts(response.items);
        setPage(response.page);
        setPageSize(response.size);
        setTotalItems(response.totalItems);
        setTotalPages(response.totalPages);
        setSelectedId((current) =>
          current && response.items.some((account) => account.id === current)
            ? current
            : null,
        );
      } catch {
        setError("Unable to load accounts.");
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    void loadAccounts({
      page,
      size: pageSize,
      search,
      status: statusFilter,
      type: typeFilter || undefined,
    });
  }, [loadAccounts, page, pageSize, search, statusFilter, typeFilter]);

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
        const detailed = await getAccountById(created.id, accessToken);
        setSelectedId(detailed.id);
        setIsCreating(false);
        setSearch(detailed.name);
        setStatusFilter("ALL");
        setTypeFilter(detailed.type);
        setPage(0);
      } else if (selectedAccount) {
        const updated = await updateAccount(
          selectedAccount.id,
          mapFormValuesToPayload(values),
          accessToken,
        );
        setSelectedId(updated.id);
        setSearch((current) =>
          current.trim().length === 0 ? current : updated.name,
        );
        setTypeFilter((current) => (current === "" ? current : updated.type));
        setPage(0);
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
      setSelectedId(archived.id);
      setPage(0);
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
    setSelectedId(null);
    setError(null);
  }

  function handleCloseDrawer() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
  }

  const rangeStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const rangeEnd =
    totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);
  const hasPreviousPage = page > 0;
  const hasNextPage = page + 1 < totalPages;

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
        <section className={styles.stack}>
          <Card className={styles.toolbarPanel}>
            <div className={styles.toolbar}>
              <div className={styles.filterGroup}>
                <Field htmlFor="account-search" label="Search">
                  <Input
                    id="account-search"
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(0);
                    }}
                    placeholder="Search accounts"
                    value={search}
                  />
                </Field>

                <Field htmlFor="account-status-filter" label="Status">
                  <Select
                    id="account-status-filter"
                    onChange={(event) => {
                      setStatusFilter(
                        event.target.value as "ALL" | "ACTIVE" | "ARCHIVED",
                      );
                      setPage(0);
                    }}
                    value={statusFilter}
                  >
                    <option value="ALL">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Archived</option>
                  </Select>
                </Field>

                <Field htmlFor="account-type-filter" label="Type">
                  <Select
                    id="account-type-filter"
                    onChange={(event) => {
                      setTypeFilter(event.target.value as "" | AccountType);
                      setPage(0);
                    }}
                    value={typeFilter}
                  >
                    <option value="">All types</option>
                    <option value="CHECKING">Checking</option>
                    <option value="SAVINGS">Savings</option>
                    <option value="CREDIT_CARD">Credit card</option>
                    <option value="INVESTMENT">Investment</option>
                  </Select>
                </Field>
              </div>
            </div>
          </Card>

          <section className={styles.accountGrid}>
            {accounts.length === 0 ? (
              <Card className={styles.emptyState}>
                <p>No accounts found for the current filters.</p>
              </Card>
            ) : (
              accounts.map((account) => (
                <Card key={account.id} className={styles.accountCard}>
                  <button
                    className={styles.accountButton}
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedId(account.id);
                      setError(null);
                    }}
                    type="button"
                  >
                    <div className={styles.accountHeader}>
                      <div>
                        <strong>{account.name}</strong>
                        <p className={styles.accountMeta}>
                          {ACCOUNT_TYPE_LABELS[account.type]}
                          {account.brand ? ` · ${account.brand}` : ""}
                        </p>
                      </div>
                      {account.color ? (
                        <span
                          aria-hidden="true"
                          className={styles.swatchDot}
                          style={{ backgroundColor: account.color }}
                        />
                      ) : null}
                    </div>

                    <div className={styles.accountBadges}>
                      <span className={styles.badge}>
                        {ACCOUNT_TYPE_LABELS[account.type]}
                      </span>
                      {account.closingDay && account.dueDay ? (
                        <span className={`${styles.badge} ${styles.badgeInfo}`}>
                          Closes {account.closingDay} · Due {account.dueDay}
                        </span>
                      ) : null}
                      <span
                        className={
                          account.archivedFromMonth
                            ? `${styles.badge} ${styles.badgeMuted}`
                            : `${styles.badge} ${styles.badgeSuccess}`
                        }
                      >
                        {account.archivedFromMonth
                          ? `Archived from ${formatReferenceMonth(account.archivedFromMonth)}`
                          : "Active"}
                      </span>
                    </div>
                  </button>
                </Card>
              ))
            )}
          </section>

          <Card className={styles.footerPanel}>
            <div className={styles.footer}>
              <span className={styles.rangeLabel}>
                {rangeStart}-{rangeEnd} of {totalItems}
              </span>

              <div className={styles.paginationControls}>
                <label className={styles.rowsControl}>
                  <span>Rows</span>
                  <Select
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(0);
                    }}
                    value={String(pageSize)}
                  >
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="48">48</option>
                  </Select>
                </label>

                <div className={styles.paginationButtons}>
                  <Button
                    disabled={!hasPreviousPage}
                    onClick={() => setPage((current) => current - 1)}
                    type="button"
                    variant="secondary"
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={!hasNextPage}
                    onClick={() => setPage((current) => current + 1)}
                    type="button"
                    variant="secondary"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {isCreating || selectedAccount ? (
            <Drawer
              description={
                isCreating
                  ? "Add a new financial account or credit card."
                  : "Update account details and archive it when needed."
              }
              onClose={handleCloseDrawer}
              title={isCreating ? "New account" : "Account details"}
            >
              <div className={styles.drawerStack}>
                <form
                  className={styles.form}
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <Field
                    error={form.formState.errors.name?.message}
                    htmlFor="account-name"
                    label="Name"
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
                      error={form.formState.errors.type?.message}
                      htmlFor="account-type"
                      label="Type"
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
                      error={form.formState.errors.color?.message}
                      htmlFor="account-color"
                      label="Color"
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
                        error={form.formState.errors.brand?.message}
                        htmlFor="account-brand"
                        label="Brand"
                      >
                        <Input
                          id="account-brand"
                          {...form.register("brand")}
                          hasError={Boolean(form.formState.errors.brand)}
                          placeholder="Visa"
                        />
                      </Field>

                      <Field
                        error={form.formState.errors.closingDay?.message}
                        htmlFor="account-closing-day"
                        label="Closing day"
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
                        label="Due day"
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
                      <span>{colorValue}</span>
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

                {selectedAccount &&
                !selectedAccount.archivedFromMonth &&
                !isCreating ? (
                  <Card className={styles.archivePanel}>
                    <div className={styles.archiveHeader}>
                      <h3 className={styles.archiveTitle}>Archive account</h3>
                      <p className={styles.archiveSubtitle}>
                        Stop using this account from a specific month onward.
                      </p>
                    </div>

                    <form
                      className={styles.form}
                      onSubmit={archiveForm.handleSubmit(onArchive)}
                    >
                      <Field
                        error={
                          archiveForm.formState.errors.archivedFromMonth
                            ?.message
                        }
                        htmlFor="account-archive-month"
                        label="Archive month"
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
            </Drawer>
          ) : null}
        </section>
      )}
    </AppShell>
  );
}
