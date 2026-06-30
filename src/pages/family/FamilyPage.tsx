import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  archiveFamilyMember,
  createFamilyMember,
  listFamilyMembers,
  restoreFamilyMember,
  type FamilyMember,
  type FamilyRole,
  updateFamilyMember,
} from "../../app/api/family";
import { useAuth } from "../../app/auth/useAuth";
import AppShell from "../../components/layout/AppShell";
import Spinner from "../../components/feedback/Spinner";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Checkbox from "../../components/ui/Checkbox";
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
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  const loadMembers = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await listFamilyMembers(accessToken);
      setMembers(response);

      if (response.length > 0) {
        setSelectedId((current) =>
          current && response.some((member) => member.id === current)
            ? current
            : response[0].id,
        );
      } else {
        setSelectedId(null);
      }
    } catch {
      setError("Unable to load family members.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

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
        setMembers((current) => [created, ...current]);
        setSelectedId(created.id);
        setIsCreating(false);
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
        setMembers((current) =>
          current.map((member) =>
            member.id === updated.id ? updated : member,
          ),
        );
      }
    } catch {
      setError("Unable to save the family member.");
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

      setMembers((current) =>
        current.map((member) => (member.id === updated.id ? updated : member)),
      );
    } catch {
      setError("Unable to update the member status.");
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
    if (members[0]) {
      setSelectedId(members[0].id);
    }
  }

  return (
    <AppShell
      title="Family"
      subtitle="Manage members, permissions, and allowance eligibility."
      actions={
        <Button onClick={handleStartCreate} type="button">
          New member
        </Button>
      }
    >
      {isLoading ? (
        <Card className={styles.loadingCard}>
          <Spinner label="Loading family members" />
        </Card>
      ) : (
        <section className={styles.layout}>
          <Card className={styles.listPanel}>
            <div className={styles.listHeader}>
              <h2 className={styles.panelTitle}>Members</h2>
              <span className={styles.count}>{members.length}</span>
            </div>

            <div className={styles.memberList}>
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={
                    member.id === selectedId && !isCreating
                      ? `${styles.memberItem} ${styles.memberItemActive}`
                      : styles.memberItem
                  }
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedId(member.id);
                    setError(null);
                  }}
                >
                  <div>
                    <strong>{member.name}</strong>
                    <p className={styles.memberMeta}>
                      {member.email} · {member.role}
                    </p>
                  </div>
                  <div className={styles.memberBadges}>
                    <span
                      className={
                        member.active
                          ? `${styles.badge} ${styles.badgeSuccess}`
                          : `${styles.badge} ${styles.badgeMuted}`
                      }
                    >
                      {member.active ? "Active" : "Archived"}
                    </span>
                    {member.allowanceEnabled ? (
                      <span className={styles.badge}>Allowance</span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className={styles.formPanel}>
            <div className={styles.formHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  {isCreating ? "New member" : "Member details"}
                </h2>
                <p className={styles.formSubtitle}>
                  {isCreating
                    ? "Create a family member with role and allowance settings."
                    : "Update the member information and access level."}
                </p>
              </div>

              {!isCreating && selectedMember ? (
                <Button
                  onClick={() => void handleArchiveToggle()}
                  type="button"
                  variant="secondary"
                  loading={isArchiving}
                >
                  {selectedMember.active ? "Archive" : "Restore"}
                </Button>
              ) : null}
            </div>

            <form
              className={styles.form}
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
            >
              <Field
                label="Name"
                htmlFor="family-name"
                error={form.formState.errors.name?.message}
              >
                <Input
                  id="family-name"
                  hasError={Boolean(form.formState.errors.name)}
                  {...form.register("name")}
                />
              </Field>

              <Field
                label="Email"
                htmlFor="family-email"
                error={form.formState.errors.email?.message}
              >
                <Input
                  id="family-email"
                  type="email"
                  hasError={Boolean(form.formState.errors.email)}
                  {...form.register("email")}
                />
              </Field>

              <Field
                label={isCreating ? "Password" : "Password (optional)"}
                htmlFor="family-password"
                error={form.formState.errors.password?.message}
              >
                <Input
                  id="family-password"
                  type="password"
                  hasError={Boolean(form.formState.errors.password)}
                  {...form.register("password")}
                />
              </Field>

              <Field
                label="Role"
                htmlFor="family-role"
                error={form.formState.errors.role?.message}
              >
                <Select
                  id="family-role"
                  hasError={Boolean(form.formState.errors.role)}
                  {...form.register("role")}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </Field>

              <Checkbox
                label="Allowance enabled"
                {...form.register("allowanceEnabled")}
              />

              <FormError>{error}</FormError>

              <div className={styles.formActions}>
                <Button type="submit" loading={isSaving}>
                  {isCreating ? "Create member" : "Save changes"}
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
        </section>
      )}
    </AppShell>
  );
}
