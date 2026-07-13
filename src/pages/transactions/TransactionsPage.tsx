import { useCallback, useMemo, useState } from "react";
import type { Account } from "../../app/api/accounts";
import type { CategoryOption } from "../../app/api/categories";
import type { FamilyMember } from "../../app/api/family";
import {
  type OwnershipType,
  type Transaction,
  type TransactionFilters,
  type TransactionType,
} from "../../app/api/transactions";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import CategoryMultiSelect from "../../components/ui/CategoryMultiSelect";
import Drawer from "../../components/ui/Drawer";
import MonthSelector from "../../components/ui/MonthSelector";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { useI18n } from "../../app/i18n/I18nContext";
import {
  formatReferenceMonth,
  getCurrentReferenceMonth,
} from "../../lib/formatters/date";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";
import styles from "./TransactionsPage.module.scss";

type Translate = ReturnType<typeof useI18n>["t"];

function formatCategoryFilterLabel(
  selectedCategories: CategoryOption[],
  t: Translate,
) {
  if (selectedCategories.length === 0) {
    return "";
  }

  const labelPrefix = `${t("common.categories")}: `;

  if (selectedCategories.length === 1) {
    return `${labelPrefix}${selectedCategories[0].name}`;
  }

  if (selectedCategories.length === 2) {
    return `${labelPrefix}${selectedCategories[0].name}, ${selectedCategories[1].name}`;
  }

  return `${labelPrefix}${selectedCategories[0].name} +${selectedCategories.length - 1}`;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const initialReferenceMonth = useMemo(() => getCurrentReferenceMonth(), []);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    referenceMonth: initialReferenceMonth,
  });

  const allowanceMembers = useMemo(
    () => members.filter((m) => m.active && m.allowanceEnabled),
    [members],
  );

  const handleSelect = useCallback((id: string, transaction: Transaction) => {
    setSelectedTransactionId(id);
    setSelectedTransaction(transaction);
    setDrawerOpen(true);
  }, []);

  const handleStartCreate = useCallback(() => {
    setSelectedTransactionId(null);
    setSelectedTransaction(null);
    setDrawerOpen(true);
  }, []);

  const handleFormSuccess = useCallback((intent?: "save-and-create-new") => {
    if (intent === "save-and-create-new") {
      return;
    }
    setSelectedTransactionId(null);
    setSelectedTransaction(null);
    setDrawerOpen(false);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleCancelForm = useCallback(() => {
    setSelectedTransactionId(null);
    setSelectedTransaction(null);
    setDrawerOpen(false);
  }, []);

  const handleReferenceDataLoaded = useCallback(
    (data: {
      accounts: Account[];
      categories: CategoryOption[];
      members: FamilyMember[];
    }) => {
      setAccounts(data.accounts);
      setCategoryOptions(data.categories);
      setMembers(data.members);
    },
    [],
  );

  const activeFilters = useMemo(() => {
    const accountName =
      accounts.find((a) => a.id === filters.accountId)?.name ?? "";
    const selectedCategories = categoryOptions.filter((cat) =>
      filters.categoryIds?.includes(cat.id),
    );
    const memberName =
      allowanceMembers.find((m) => m.id === filters.memberId)?.name ?? "";

    return [
      ...(filters.search
        ? [
            {
              key: "search",
              label: `${t("common.search")}: ${filters.search}`,
              onRemove: () => {
                setFilters((current) => ({ ...current, search: undefined }));
              },
            },
          ]
        : []),
      ...(filters.type
        ? [
            {
              key: "type",
              label: `${t("common.type")}: ${t(
                `transactionTypes.${filters.type}`,
              )}`,
              onRemove: () => {
                setFilters((current) => ({ ...current, type: undefined }));
              },
            },
          ]
        : []),
      ...(filters.ownershipType
        ? [
            {
              key: "ownership",
              label: `${t("common.ownership")}: ${t(
                `ownershipTypes.${filters.ownershipType}`,
              )}`,
              onRemove: () => {
                setFilters((current) => ({
                  ...current,
                  ownershipType: undefined,
                }));
              },
            },
          ]
        : []),
      ...(filters.accountId && accountName
        ? [
            {
              key: "account",
              label: `${t("common.account")}: ${accountName}`,
              onRemove: () => {
                setFilters((current) => ({ ...current, accountId: undefined }));
              },
            },
          ]
        : []),
      ...(selectedCategories.length > 0
        ? [
            {
              key: "category",
              label: formatCategoryFilterLabel(selectedCategories, t),
              onRemove: () => {
                setFilters((current) => ({
                  ...current,
                  categoryIds: undefined,
                }));
              },
            },
          ]
        : []),
      ...(filters.memberId && memberName
        ? [
            {
              key: "member",
              label: `${t("common.member")}: ${memberName}`,
              onRemove: () => {
                setFilters((current) => ({ ...current, memberId: undefined }));
              },
            },
          ]
        : []),
    ];
  }, [accounts, allowanceMembers, categoryOptions, filters, t]);

  function clearFilters() {
    setFilters((current) => ({
      referenceMonth: current.referenceMonth,
    }));
  }

  const isCreating = selectedTransactionId === null;

  return (
    <AppShell
      title={t("transactions.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("transactions.new")}
        </Button>
      }
    >
      <section className={styles.stack}>
        <Card className={styles.toolbarPanel}>
          <FilterToolbar
            activeFilters={activeFilters}
            isPanelOpen={isFiltersOpen}
            onClearFilters={clearFilters}
            onClosePanel={() => setIsFiltersOpen(false)}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
            primaryContent={
              <>
                <Field
                  label={t("common.referenceMonth")}
                  htmlFor="transaction-filter-month"
                >
                  <MonthSelector
                    id="transaction-filter-month"
                    onChange={(newMonth) => {
                      setFilters((current) => ({
                        ...current,
                        referenceMonth: newMonth,
                      }));
                    }}
                    value={filters.referenceMonth}
                  />
                </Field>
                <Field htmlFor="transaction-search" label={t("common.search")}>
                  <Input
                    id="transaction-search"
                    onChange={(event) => {
                      setFilters((current) => ({
                        ...current,
                        search:
                          event.target.value.length > 0
                            ? event.target.value
                            : undefined,
                      }));
                    }}
                    placeholder={t("transactions.searchPlaceholder")}
                    value={filters.search ?? ""}
                  />
                </Field>
                <Field
                  label={t("common.type")}
                  htmlFor="transaction-filter-type"
                >
                  <Select
                    id="transaction-filter-type"
                    onChange={(event) => {
                      setFilters((current) => ({
                        ...current,
                        type:
                          event.target.value.length > 0
                            ? (event.target.value as TransactionType)
                            : undefined,
                      }));
                    }}
                    value={filters.type ?? ""}
                  >
                    <option value="">{t("common.allTypes")}</option>
                    <option value="INCOME">
                      {t("transactionTypes.INCOME")}
                    </option>
                    <option value="EXPENSE">
                      {t("transactionTypes.EXPENSE")}
                    </option>
                  </Select>
                </Field>
              </>
            }
            secondaryContent={
              <>
                <Field
                  label={t("common.ownership")}
                  htmlFor="transaction-filter-ownership"
                >
                  <Select
                    id="transaction-filter-ownership"
                    onChange={(event) => {
                      setFilters((current) => ({
                        ...current,
                        ownershipType:
                          event.target.value.length > 0
                            ? (event.target.value as OwnershipType)
                            : undefined,
                      }));
                    }}
                    value={filters.ownershipType ?? ""}
                  >
                    <option value="">{t("common.allOwnerships")}</option>
                    <option value="SHARED">{t("ownershipTypes.SHARED")}</option>
                    <option value="INDIVIDUAL">
                      {t("ownershipTypes.INDIVIDUAL")}
                    </option>
                  </Select>
                </Field>

                <Field
                  label={t("common.account")}
                  htmlFor="transaction-filter-account"
                >
                  <Select
                    id="transaction-filter-account"
                    onChange={(event) => {
                      setFilters((current) => ({
                        ...current,
                        accountId: event.target.value || undefined,
                      }));
                    }}
                    value={filters.accountId ?? ""}
                  >
                    <option value="">{t("common.allAccounts")}</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label={t("common.categories")}
                  htmlFor="transaction-filter-category"
                >
                  <CategoryMultiSelect
                    id="transaction-filter-category"
                    onChange={(value) => {
                      setFilters((current) => ({
                        ...current,
                        categoryIds: value.length > 0 ? value : undefined,
                      }));
                    }}
                    options={categoryOptions}
                    placeholder={t("common.allCategories")}
                    value={filters.categoryIds ?? []}
                  />
                </Field>

                <Field
                  label={t("common.member")}
                  htmlFor="transaction-filter-member"
                >
                  <Select
                    id="transaction-filter-member"
                    onChange={(event) => {
                      setFilters((current) => ({
                        ...current,
                        memberId: event.target.value || undefined,
                      }));
                    }}
                    value={filters.memberId ?? ""}
                  >
                    <option value="">{t("common.allMembers")}</option>
                    {allowanceMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            }
          />
        </Card>

        <TransactionList
          filters={filters}
          selectedId={selectedTransactionId}
          onSelect={handleSelect}
          refreshKey={refreshKey}
          onReferenceDataLoaded={handleReferenceDataLoaded}
        />

        {drawerOpen ? (
          <Drawer
            description={
              isCreating
                ? t("transactions.newDescription")
                : t("transactions.editDescription", {
                    month: formatReferenceMonth(filters.referenceMonth),
                  })
            }
            onClose={handleCancelForm}
            title={
              isCreating
                ? t("transactions.newTitle")
                : t("transactions.detailsTitle")
            }
          >
            <div className={styles.drawerStack}>
              <TransactionForm
                key={selectedTransactionId ?? "create"}
                transaction={selectedTransaction}
                user={user!}
                accounts={accounts}
                categories={categoryOptions}
                members={members}
                referenceMonth={filters.referenceMonth}
                onSuccess={handleFormSuccess}
                onCancel={handleCancelForm}
              />
            </div>
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
