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
import { useMobileSearchToggle } from "../../lib/useMobileSearchToggle";
import { useFiltersState } from "../../lib/useFiltersState";
import FamilyMemberList from "./FamilyMemberList";
import FamilyMemberForm from "./FamilyMemberForm";
import styles from "./FamilyPage.module.scss";

type FamilyFilters = { search: string; status: StatusFilter };
type DrawerState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; member: FamilyMember };

const DEFAULT_FILTERS: FamilyFilters = {
  search: "",
  status: ACTIVE_STATUS_FILTER,
};

export default function FamilyPage() {
  const { t } = useI18n();
  const { filters, patchFilters, clearFilter } = useFiltersState(DEFAULT_FILTERS);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [drawerState, setDrawerState] = useState<DrawerState>({ mode: "closed" });
  const [refreshKey, setRefreshKey] = useState(0);
  const mobileSearch = useMobileSearchToggle();

  const isCreating = drawerState.mode === "create";
  const isDrawerOpen = drawerState.mode !== "closed";
  const selectedMember = drawerState.mode === "edit" ? drawerState.member : null;

  function handleStartCreate() {
    setDrawerState({ mode: "create" });
  }

  function handleCloseDrawer() {
    setDrawerState({ mode: "closed" });
  }

  function handleSuccess() {
    setDrawerState({ mode: "closed" });
    setRefreshKey((k) => k + 1);
  }

  const handleSelect = useCallback((_id: string, member: FamilyMember) => {
    setDrawerState({ mode: "edit", member });
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
            inputRef={mobileSearch.inputRef}
            label={t("common.search")}
            onBlur={mobileSearch.handleBlur}
            onChange={(search) => {
              patchFilters({ search });
            }}
            onFocus={mobileSearch.handleFocus}
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
    [filters.search, filters.status, mobileSearch.handleBlur, mobileSearch.handleFocus, mobileSearch.inputRef, patchFilters, t],
  );

  return (
    <AppShell
      mobileActionBarHidden={isDrawerOpen}
      mobileSearchDockVisible={mobileSearch.isOpen}
      mobileActions={{
        createLabel: t("family.new"),
        onCreate: handleStartCreate,
        onSearch: mobileSearch.open,
        searchExpanded: mobileSearch.isOpen,
      }}
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
            onDismissMobileSearchFocus={mobileSearch.blurInput}
            onCloseMobileSearch={mobileSearch.close}
            isMobileSearchFocused={mobileSearch.isFocused}
            isMobileSearchOpen={mobileSearch.isOpen}
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
          <Drawer onClose={handleCloseDrawer} title={isCreating ? t("family.newTitle") : t("family.detailsTitle")}>
            <FamilyMemberForm member={selectedMember} onSuccess={handleSuccess} onCancel={handleCloseDrawer} />
          </Drawer>
        ) : null}
      </section>
    </AppShell>
  );
}
