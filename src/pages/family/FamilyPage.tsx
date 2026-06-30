import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  archiveFamilyMember,
  createFamilyMember,
  getFamilyMemberById,
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
import Drawer from "../../components/ui/Drawer";
import Field from "../../components/ui/Field";
import FormError from "../../components/ui/FormError";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import {
  createFamilyMemberSchema,
  type CreateFamilyMemberFormValues,
  type UpdateFamilyMemberFormValues,
  updateFamilyMemberSchema,
} from "../../lib/validation/familyMemberSchema";
import { useI18n } from "../../app/i18n/I18nContext";
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
const DEFAULT_PAGE_SIZE = 12;

export default function FamilyPage() {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedId) ?? null,
    [members, selectedId],
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
        setTotalPages(response.totalPages);
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

  useEffect(() => {
    if (isCreating) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (selectedMember) {
      form.reset({
        name: selectedMember.name,
        email: selectedMember.email,
        password: "",
        role: selectedMember.role,
        allowanceEnabled: selectedMember.allowanceEnabled,
      });
    }
  }, [form, isCreating, selectedMember]);

  async function onSubmit(values: FamilyFormValues) {
    if (!accessToken) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        const created = await createFamilyMember(
          {
            name: values.name,
            email: values.email,
            password: values.password,
            role: values.role as FamilyRole,
            allowanceEnabled: values.allowanceEnabled,
          },
          accessToken,
        );
        const detailed = await getFamilyMemberById(created.id, accessToken);
        setSelectedId(detailed.id);
        setIsCreating(false);
        setSearch(detailed.name);
        setStatusFilter("ALL");
        setPage(0);
      } else if (selectedMember) {
        const updated = await updateFamilyMember(
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
        setSelectedId(updated.id);
        setSearch((current) =>
          current.trim().length === 0 ? current : updated.name,
        );
        setPage(0);
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
      setPage(0);
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

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const rangeStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const rangeEnd =
    totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);
  const hasPreviousPage = page > 0;
  const hasNextPage = page + 1 < totalPages;

  return (
    <AppShell
      title={t("family.title")}
      subtitle={t("family.subtitle")}
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
            <div className={styles.toolbar}>
              <div className={styles.filterGroup}>
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
              </div>
            </div>
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

          <Card className={styles.footerPanel}>
            <div className={styles.footer}>
              <span className={styles.rangeLabel}>
                {t("common.range", {
                  start: rangeStart,
                  end: rangeEnd,
                  total: totalItems,
                })}
              </span>

              <div className={styles.paginationControls}>
                <label className={styles.rowsControl}>
                  <span>{t("common.rows")}</span>
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
                    {t("common.previous")}
                  </Button>
                  <Button
                    disabled={!hasNextPage}
                    onClick={() => setPage((current) => current + 1)}
                    type="button"
                    variant="secondary"
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

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
                        : t("common.saveChanges")}
                    </Button>
                    {isCreating ? (
                      <Button
                        onClick={handleCancelCreate}
                        type="button"
                        variant="secondary"
                      >
                        {t("common.cancel")}
                      </Button>
                    ) : null}
                  </div>
                </form>

                {!isCreating && selectedMember ? (
                  <Card className={styles.archivePanel}>
                    <div className={styles.archiveHeader}>
                      <h3 className={styles.archiveTitle}>
                        {t("family.memberStatus")}
                      </h3>
                      <p className={styles.archiveSubtitle}>
                        Arquive o membro para desabilitar o acesso ou reative
                        depois.
                      </p>
                    </div>

                    <Button
                      loading={isArchiving}
                      onClick={() => void handleArchiveToggle()}
                      type="button"
                      variant="secondary"
                    >
                      {selectedMember.active
                        ? t("family.archiveMember")
                        : t("family.restoreMember")}
                    </Button>
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
