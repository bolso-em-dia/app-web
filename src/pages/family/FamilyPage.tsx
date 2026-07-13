import { useCallback, useMemo, useState } from "react";
import type { FamilyMember } from "../../app/api/family";
import { useI18n } from "../../app/i18n/I18nContext";
import AppShell from "../../components/layout/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Drawer from "../../components/ui/Drawer";
import FilterToolbar from "../../components/ui/FilterToolbar";
import FilterSelectInput from "../../components/ui/filterFields/FilterSelectInput";
import FilterTextInput from "../../components/ui/filterFields/FilterTextInput";
import { ACTIVE_STATUS_FILTER, type StatusFilter } from "../../lib/constants";
import type { FilterFields } from "../../lib/filterFields";
import { useFiltersState } from "../../lib/useFiltersState";
import FamilyMemberList from "./FamilyMemberList";
import FamilyMemberForm from "./FamilyMemberForm";
import styles from "./FamilyPage.module.scss";

type FamilyFilters = { search: string; status: StatusFilter };
const DEFAULT_FILTERS: FamilyFilters = {
  search: "",
  status: ACTIVE_STATUS_FILTER,
};

export default function FamilyPage() {
  const { t } = useI18n();
  const { filters, patchFilters, clearFilter } = useFiltersState(DEFAULT_FILTERS);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
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

  const handleSelect = useCallback((_id: string, member: FamilyMember) => {
    setSelectedMember(member);
    setIsDrawerOpen(true);
  }, []);

  const fields = useMemo<FilterFields>(
    () => ({
      search: {
        kind: "text",
        label: t("common.search"),
        value: filters.search,
        defaultValue: "",
        placement: "visible",
        element: (
          <FilterTextInput
            id="family-search"
            label={t("common.search")}
            onChange={(search) => {
              patchFilters({ search });
            }}
            placeholder={t("family.searchPlaceholder")}
            value={filters.search}
          />
        ),
      },
      status: {
        kind: "select",
        label: t("common.status"),
        value: filters.status,
        defaultValue: ACTIVE_STATUS_FILTER,
        placement: "expanded",
        options: [
          { value: "ALL", label: t("common.all") },
          { value: "ACTIVE", label: t("common.active") },
          { value: "ARCHIVED", label: t("common.archived") },
        ],
        element: (
          <FilterSelectInput<StatusFilter>
            id="family-status-filter"
            label={t("common.status")}
            onChange={(status) => {
              patchFilters({ status: status as StatusFilter });
            }}
            options={[
              { value: "ALL", label: t("common.all") },
              { value: "ACTIVE", label: t("common.active") },
              { value: "ARCHIVED", label: t("common.archived") },
            ]}
            placeholder={t("common.all")}
            value={filters.status}
          />
        ),
      },
    }),
    [filters.search, filters.status, patchFilters, t],
  );

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
            fields={fields}
            isPanelOpen={isFiltersOpen}
            onClosePanel={() => setIsFiltersOpen(false)}
            onResetField={(name, defaultValue) => {
              clearFilter(name as keyof FamilyFilters, defaultValue as FamilyFilters[keyof FamilyFilters]);
            }}
            onTogglePanel={() => setIsFiltersOpen((current) => !current)}
          />
        </Card>

        <FamilyMemberList filters={filters} selectedId={selectedMember?.id ?? null} onSelect={handleSelect} refreshKey={refreshKey} />

        {isDrawerOpen ? (
          <Drawer
            description={isCreating ? t("family.newDescription") : t("family.editDescription")}
            onClose={handleCloseDrawer}
            title={isCreating ? t("family.newTitle") : t("family.detailsTitle")}
          >
            <FamilyMemberForm member={selectedMember} onSuccess={handleSuccess} onCancel={handleCloseDrawer} />
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
