import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  archiveFamilyMember,
  createFamilyMember,
  listFamilyMemberPage,
  restoreFamilyMember,
  type FamilyMember,
  type FamilyMemberListParams,
  type FamilyRole,
  updateFamilyMember,
} from "../../app/api/family";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Spinner from "../../components/feedback/Spinner";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Checkbox from "../../components/ui/Checkbox";
import ConfirmAction from "../../components/ui/ConfirmAction";
import Drawer from "../../components/ui/Drawer";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import FormError from "../../components/ui/FormError";
import PaginationBar from "../../components/ui/PaginationBar";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import {
  createFamilyMemberSchema as buildCreateFamilyMemberSchema,
  type CreateFamilyMemberFormValues,
  type UpdateFamilyMemberFormValues,
  createUpdateFamilyMemberSchema,
} from "../../lib/validation/familyMemberSchema";
import { useI18n } from "../../app/i18n/I18nContext";
import { DEFAULT_PAGE_SIZE } from "../../lib/constants";
import { usePagination } from "../../lib/usePagination";
import styles from "./FamilyPage.module.scss";

type FamilyFormValues =
  CreateFamilyMemberFormValues | UpdateFamilyMemberFormValues;

const DEFAULT_VALUES: CreateFamilyMemberFormValues = {
  name: "",
  email: "",
  password: "",
  role: "USER",
  allowanceEnabled: false,
};


export default function FamilyPage() {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ACTIVE");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedId) ?? null,
    [members, selectedId],
  );

  const createFamilyMemberSchema = useMemo(
    () => buildCreateFamilyMemberSchema(t),
    [t],
  );
  const updateFamilyMemberSchema = useMemo(
    () => createUpdateFamilyMemberSchema(t),
    [t],
  );

  const form = useForm<FamilyFormValues>({
    resolver: zodResolver(
      isCreating ? createFamilyMemberSchema : updateFamilyMemberSchema,
    ),
    defaultValues: DEFAULT_VALUES,
  });

  const loadMembers = useCallback(
    async (params: FamilyMemberListParams) => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await listFamilyMemberPage(params, accessToken);
        setMembers(response.items);
        setPage(response.page);
        setPageSize(response.size);
        setTotalItems(response.totalItems);
        setSelectedId((current) =>
          current && response.items.some((member) => member.id === current)
            ? current
            : null,
        );
      } catch {
        setError(t("family.error"));
      } finally {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [accessToken, t],
  );

  useEffect(() => {
    void loadMembers({
      page,
      size: pageSize,
      search,
      status: statusFilter,
    });
  }, [loadMembers, page, pageSize, search, statusFilter]);

  async function onSubmit(values: FamilyFormValues) {
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
        handleCloseDrawer();
        await loadMembers({
          page,
          size: pageSize,
          search,
          status: statusFilter,
        });
      } else if (selectedMember) {
        await updateFamilyMember(
          selectedMember.id,
          {
            name: values.name,
            email: values.email,
            password: values.password || undefined,
            role: values.role as FamilyRole,
            allowanceEnabled: values.allowanceEnabled,
          },
          accessToken,
        );
        handleCloseDrawer();
        await loadMembers({
          page,
          size: pageSize,
          search,
          status: statusFilter,
        });
      }
    } catch {
      setError(t("family.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchiveToggle() {
    if (!accessToken || !selectedMember) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      const updated = selectedMember.active
        ? await archiveFamilyMember(selectedMember.id, accessToken)
        : await restoreFamilyMember(selectedMember.id, accessToken);
      setSelectedId(updated.id);
      await loadMembers({
        page,
        size: pageSize,
        search,
        status: statusFilter,
      });
    } catch {
      setError(t("family.statusError"));
    } finally {
      setIsArchiving(false);
    }
  }

  function handleStartCreate() {
    setIsCreating(true);
    setSelectedId(null);
    setError(null);
    form.reset(DEFAULT_VALUES);
  }

  function handleCancelCreate() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
    form.reset(DEFAULT_VALUES);
  }

  function handleCloseDrawer() {
    setIsCreating(false);
    setSelectedId(null);
    setError(null);
    form.reset(DEFAULT_VALUES);
  }

  const activeFilters = useMemo(
    () => [
      ...(search
        ? [
            {
              key: "search",
              label: `${t("common.search")}: ${search}`,
              onRemove: () => {
                setSearch("");
                setPage(0);
              },
            },
          ]
        : []),
      ...(statusFilter !== "ACTIVE"
        ? [
            {
              key: "status",
              label: `${t("common.status")}: ${t(
                statusFilter === "ALL" ? "common.all" : "common.archived",
              )}`,
              onRemove: () => {
                setStatusFilter("ACTIVE");
                setPage(0);
              },
            },
          ]
        : []),
    ],
    [search, statusFilter, t],
  );

  function clearFilters() {
    setSearch("");
    setStatusFilter("ACTIVE");
    setPage(0);
  }

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const pagination = usePagination(page, pageSize, totalItems, totalPages);

  return (
    <AppShell
      title={t("family.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("family.new")}
        </Button>
      }
    >
      {showInitialLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label={t("family.loading")} />
        </Card>
      ) : (
        <section className={styles.stack}>
          <Card className={styles.toolbarPanel}>
            <FilterToolbar
              activeFilters={activeFilters}
              isPanelOpen={isFiltersOpen}
              onClearFilters={clearFilters}
              onClosePanel={() => setIsFiltersOpen(false)}
              onTogglePanel={() => setIsFiltersOpen((current) => !current)}
              primaryContent={
                <Field htmlFor="family-search" label={t("common.search")}>
                  <Input
                    id="family-search"
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(0);
                    }}
                    placeholder={t("family.searchPlaceholder")}
                    value={search}
                  />
                </Field>
              }
              secondaryContent={
                <>
                  <Field
                    htmlFor="family-status-filter"
                    label={t("common.status")}
                  >
                    <Select
                      id="family-status-filter"
                      onChange={(event) => {
                        setStatusFilter(
                          event.target.value as "ALL" | "ACTIVE" | "ARCHIVED",
                        );
                        setPage(0);
                      }}
                      value={statusFilter}
                    >
                      <option value="ALL">{t("common.all")}</option>
                      <option value="ACTIVE">{t("common.active")}</option>
                      <option value="ARCHIVED">{t("common.archived")}</option>
                    </Select>
                  </Field>
                </>
              }
            />
          </Card>

          <section className={styles.memberGrid}>
            {members.length === 0 ? (
              <Card className={styles.emptyState}>
                <p>{t("family.empty")}</p>
              </Card>
            ) : (
              members.map((member) => (
                <Card key={member.id} className={styles.memberCard}>
                  <button
                    className={styles.memberButton}
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedId(member.id);
                      setError(null);
                      form.reset({
                        name: member.name,
                        email: member.email,
                        password: "",
                        role: member.role,
                        allowanceEnabled: member.allowanceEnabled,
                      });
                    }}
                    type="button"
                  >
                    <div className={styles.memberHeader}>
                      <div>
                        <strong>{member.name}</strong>
                        <p className={styles.memberMeta}>
                          {member.email} ·{" "}
                          {t(
                            member.role === "ADMIN"
                              ? "roles.ADMIN"
                              : "roles.USER",
                          )}
                        </p>
                      </div>
                    </div>

                    <div className={styles.memberBadges}>
                      <span
                        className={
                          member.active
                            ? `${styles.badge} ${styles.badgeSuccess}`
                            : `${styles.badge} ${styles.badgeMuted}`
                        }
                      >
                        {member.active
                          ? t("common.active")
                          : t("common.archived")}
                      </span>
                      <span className={styles.badge}>
                        {t(
                          member.role === "ADMIN"
                            ? "roles.ADMIN"
                            : "roles.USER",
                        )}
                      </span>
                      {member.allowanceEnabled ? (
                        <span className={styles.badge}>
                          {t("family.allowance")}
                        </span>
                      ) : null}
                    </div>
                  </button>
                </Card>
              ))
            )}
          </section>

          <PaginationBar
            start={pagination.rangeStart}
            end={pagination.rangeEnd}
            total={totalItems}
            pageSize={pageSize}
            hasPrevious={pagination.hasPreviousPage}
            hasNext={pagination.hasNextPage}
            onPrevious={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(0);
            }}
          />

          {isCreating || selectedMember ? (
            <Drawer
              description={
                isCreating
                  ? t("family.newDescription")
                  : t("family.editDescription")
              }
              onClose={handleCloseDrawer}
              title={
                isCreating ? t("family.newTitle") : t("family.detailsTitle")
              }
            >
              <div className={styles.drawerStack}>
                <form
                  className={styles.form}
                  onSubmit={form.handleSubmit(onSubmit)}
                  noValidate
                >
                  <Field
                    error={form.formState.errors.name?.message}
                    htmlFor="family-name"
                    label={t("common.name")}
                  >
                    <Input
                      id="family-name"
                      hasError={Boolean(form.formState.errors.name)}
                      {...form.register("name")}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.email?.message}
                    htmlFor="family-email"
                    label={t("common.email")}
                  >
                    <Input
                      id="family-email"
                      hasError={Boolean(form.formState.errors.email)}
                      type="email"
                      {...form.register("email")}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.password?.message}
                    htmlFor="family-password"
                    label={
                      isCreating
                        ? t("family.password")
                        : t("family.passwordOptional")
                    }
                  >
                    <Input
                      id="family-password"
                      hasError={Boolean(form.formState.errors.password)}
                      type="password"
                      {...form.register("password")}
                    />
                  </Field>

                  <Field
                    error={form.formState.errors.role?.message}
                    htmlFor="family-role"
                    label={t("common.role")}
                  >
                    <Select
                      id="family-role"
                      hasError={Boolean(form.formState.errors.role)}
                      {...form.register("role")}
                    >
                      <option value="USER">{t("roles.USER")}</option>
                      <option value="ADMIN">{t("roles.ADMIN")}</option>
                    </Select>
                  </Field>

                  <Checkbox
                    label={t("family.allowanceEnabled")}
                    {...form.register("allowanceEnabled")}
                  />

                  <FormError>{error}</FormError>

                  <div className={styles.formActions}>
                    <Button loading={isSaving} type="submit">
                      {isCreating
                        ? t("family.create")
                        : t("common.save")}
                    </Button>
                    {isCreating ? (
                      <Button
                        onClick={handleCancelCreate}
                        type="button"
                        variant="subtle"
                      >
                        {t("common.cancel")}
                      </Button>
                    ) : (
                      <Button
                        onClick={
                          selectedMember?.active
                            ? () => setIsArchiveConfirmOpen(true)
                            : () => setIsRestoreConfirmOpen(true)
                        }
                        type="button"
                        variant={
                          selectedMember?.active ? "danger" : "secondary"
                        }
                      >
                        {selectedMember?.active
                          ? t("common.archive")
                          : t("family.restoreMember")}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </Drawer>
          ) : null}

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
        </section>
      )}
    </AppShell>
  );
}
