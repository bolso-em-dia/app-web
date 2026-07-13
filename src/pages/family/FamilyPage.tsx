import { useCallback, useMemo, useState } from "react";
import type { FamilyMember } from "../../app/api/family";
import { useI18n } from "../../app/i18n/I18nContext";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import Field from "../../components/ui/Field";
import FilterToolbar from "../../components/ui/FilterToolbar";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { type StatusFilter } from "../../lib/constants";
import FamilyMemberList from "./FamilyMemberList";
import FamilyMemberForm from "./FamilyMemberForm";
import styles from "./FamilyPage.module.scss";

type FamilyFilters = { search: string; status: StatusFilter };
const DEFAULT_FILTERS: FamilyFilters = { search: "", status: "ACTIVE" };

export default function FamilyPage() {
  const { t } = useI18n();
  const [filters, setFilters] = useState<FamilyFilters>(DEFAULT_FILTERS);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const isCreating = isDrawerOpen && !selectedMember;

  function handleStartCreate() {
    setSelectedMember(null);
    setIsDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
    setSelectedMember(null);
  }

  function handleSuccess() {
    setIsDrawerOpen(false);
    setSelectedMember(null);
    setRefreshKey((k) => k + 1);
  }

  const handleSelect = useCallback((id: string, member: FamilyMember) => {
    setSelectedMember(member);
    setIsDrawerOpen(true);
  }, []);

  const activeFilters = useMemo(
    () => [
      ...(filters.search
        ? [
            {
              key: "search",
              label: `${t("common.search")}: ${filters.search}`,
              onRemove: () => {
                setFilters((c) => ({ ...c, search: "" }));
              },
            },
          ]
        : []),
      ...(filters.status !== "ACTIVE"
        ? [
            {
              key: "status",
              label: `${t("common.status")}: ${t(
                filters.status === "ALL" ? "common.all" : "common.archived",
              )}`,
              onRemove: () => {
                setFilters((c) => ({ ...c, status: "ACTIVE" }));
              },
            },
          ]
        : []),
    ],
    [filters.search, filters.status, t],
  );

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <AppShell
      title={t("family.title")}
      actions={
        <Button onClick={handleStartCreate} type="button">
          {t("family.new")}
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
              <Field htmlFor="family-search" label={t("common.search")}>
                <Input
                  id="family-search"
                  onChange={(event) => {
                    setFilters((c) => ({ ...c, search: event.target.value }));
                  }}
                  placeholder={t("family.searchPlaceholder")}
                  value={filters.search}
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
                      setFilters((c) => ({
                        ...c,
                        status: event.target.value as StatusFilter,
                      }));
                    }}
                    value={filters.status}
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

        <FamilyMemberList
          filters={filters}
          selectedId={selectedMember?.id ?? null}
          onSelect={handleSelect}
          refreshKey={refreshKey}
        />

        {isDrawerOpen ? (
          <Drawer
            description={
              isCreating
                ? t("family.newDescription")
                : t("family.editDescription")
            }
            onClose={handleCloseDrawer}
            title={isCreating ? t("family.newTitle") : t("family.detailsTitle")}
          >
            <FamilyMemberForm
              member={selectedMember}
              onSuccess={handleSuccess}
              onCancel={handleCloseDrawer}
            />
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
