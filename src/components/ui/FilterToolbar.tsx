import { ListFilterPlus, X } from "lucide-react";
import { Fragment, useCallback, useId, useMemo } from "react";
import Drawer from "./Drawer";
import Button from "./Button";
import clsx from "./clsx";
import FilterChip from "./FilterChip";
import SearchOverlay from "./SearchOverlay";
import KeyboardAvoidingContainer from "./KeyboardAvoidingContainer";
import styles from "./FilterToolbar.module.scss";
import { useI18n } from "../../app/i18n/I18nContext";
import type { FilterFields } from "../../lib/filterFields";
import { useBreakpoint } from "../../lib/useBreakpoint";

type FilterToolbarProps = {
  fields: FilterFields;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
  onClosePanel: () => void;
  onResetField: (name: string, defaultValue: unknown) => void;
  isMobileSearchOpen?: boolean;
  onCloseMobileSearch?: () => void;
};

export default function FilterToolbar({
  fields,
  isPanelOpen,
  onTogglePanel,
  onClosePanel,
  onResetField,
  isMobileSearchOpen,
  onCloseMobileSearch,
}: FilterToolbarProps) {
  const { t } = useI18n();
  const panelId = useId();
  const isCompact = useBreakpoint(960);
  const isMobileActionLayout = useBreakpoint(640);
  const fieldEntries = useMemo(() => Object.entries(fields), [fields]);
  const visibleFields = useMemo(() => fieldEntries.filter(([, field]) => field.placement === "visible"), [fieldEntries]);
  const supportsMobileSearchToggle = typeof isMobileSearchOpen === "boolean";
  const shouldUseMobileSearchDock = supportsMobileSearchToggle && isMobileActionLayout;
  const mobileSearchEntry = useMemo(() => visibleFields.find(([name]) => name === "search") ?? null, [visibleFields]);
  const renderedVisibleFields = useMemo(
    () =>
      visibleFields.filter(([name]) => {
        if (!shouldUseMobileSearchDock) {
          return true;
        }

        return name !== "search";
      }),
    [shouldUseMobileSearchDock, visibleFields],
  );
  const expandedFields = useMemo(() => fieldEntries.filter(([, field]) => field.placement === "expanded"), [fieldEntries]);
  const shouldRenderFilterToggle = expandedFields.length > 0;
  const activeFilters = useMemo(
    () =>
      fieldEntries.flatMap(([name, field]) => {
        const label = buildActiveFilterLabel(field);

        if (!label) {
          return [];
        }

        return [
          {
            key: name,
            label,
            onRemove: () => onResetField(name, field.defaultValue),
          },
        ];
      }),
    [fieldEntries, onResetField],
  );
  const activeCount = activeFilters.length;
  const handleResetAll = useCallback(() => {
    fieldEntries.forEach(([name, field]) => {
      onResetField(name, field.defaultValue);
    });

    onCloseMobileSearch?.();
  }, [fieldEntries, onCloseMobileSearch, onResetField]);
  const displayedChips = useMemo(
    () =>
      activeCount > 0
        ? [
            ...activeFilters,
            {
              key: "clear-all",
              label: t("common.clearFilters"),
              onRemove: handleResetAll,
            },
          ]
        : [],
    [activeCount, activeFilters, handleResetAll, t],
  );
  const shouldRenderPrimaryContent = renderedVisibleFields.length > 0 || shouldRenderFilterToggle;
  const shouldRenderPrimaryRow = shouldRenderPrimaryContent || activeCount > 0;

  return (
    <div className={styles.root}>
      {shouldRenderPrimaryRow ? (
        <div className={styles.primaryRow}>
          {shouldRenderPrimaryContent ? (
            <div
              className={clsx(
                styles.primaryContent,
                renderedVisibleFields.length === 0 ? styles.primaryContentToggleOnly : "",
                renderedVisibleFields.length === 1 ? styles.primaryContentSingleField : "",
                renderedVisibleFields.length === 2 ? styles.primaryContentTwoFields : "",
              )}
            >
              {renderedVisibleFields.map(([name, field]) => (
                <div className={styles.field} key={name}>
                  <Fragment>{field.element}</Fragment>
                </div>
              ))}
              {shouldRenderFilterToggle ? (
                <Button
                  aria-controls={panelId}
                  aria-expanded={isPanelOpen}
                  aria-label={t("common.filters")}
                  className={styles.filterToggle}
                  onClick={onTogglePanel}
                  type="button"
                  variant="secondary"
                >
                  <ListFilterPlus aria-hidden="true" className={styles.filterIcon} />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {displayedChips.length > 0 ? (
        <div className={styles.chips}>
          {displayedChips.map((filter) => (
            <FilterChip key={filter.key} label={filter.label} onRemove={filter.onRemove} />
          ))}
        </div>
      ) : null}

      {shouldUseMobileSearchDock && isMobileSearchOpen && mobileSearchEntry ? (
        <>
          {onCloseMobileSearch ? <SearchOverlay onDismiss={onCloseMobileSearch} /> : null}
          <KeyboardAvoidingContainer
            className={styles.mobileSearchDock}
            enabled={shouldUseMobileSearchDock && !!isMobileSearchOpen}
            role="search"
          >
            <div className={styles.mobileSearchField}>
              <Fragment>{mobileSearchEntry[1].element}</Fragment>
            </div>
            <Button
              aria-controls={panelId}
              aria-expanded={isPanelOpen}
              aria-label={t("common.filters")}
              className={styles.mobileSearchAction}
              onClick={onTogglePanel}
              type="button"
              variant="secondary"
            >
              <ListFilterPlus aria-hidden="true" className={styles.filterIcon} />
            </Button>
            {onCloseMobileSearch ? (
              <Button
                aria-label={t("common.close")}
                className={styles.mobileSearchAction}
                onClick={onCloseMobileSearch}
                type="button"
                variant="secondary"
              >
                <X aria-hidden="true" className={styles.filterIcon} />
              </Button>
            ) : null}
          </KeyboardAvoidingContainer>
        </>
      ) : null}

      {!isCompact && isPanelOpen ? (
        <div className={styles.panel} id={panelId}>
          {expandedFields.map(([name, field]) => (
            <Fragment key={name}>{field.element}</Fragment>
          ))}
        </div>
      ) : null}

      {isCompact && isPanelOpen ? (
        <Drawer hideHeaderCloseButton title={t("common.filters")} onClose={onClosePanel}>
          <div className={styles.drawerContent}>
            <div className={clsx(styles.panel, styles.panelInDrawer)} id={panelId}>
              {expandedFields.map(([name, field]) => (
                <Fragment key={name}>{field.element}</Fragment>
              ))}
            </div>
            <div className={styles.drawerActions}>
              {activeCount > 0 ? (
                <FilterChip
                  label={t("common.clearFilters")}
                  onRemove={() => {
                    handleResetAll();
                    onClosePanel();
                  }}
                />
              ) : null}
              <Button fullWidth onClick={onClosePanel} type="button" variant="secondary">
                {t("common.close")}
              </Button>
            </div>
          </div>
        </Drawer>
      ) : null}
    </div>
  );
}

function buildActiveFilterLabel(field: FilterFields[string]) {
  if (field.kind === "text") {
    if (!field.value.trim() || field.value === field.defaultValue) {
      return null;
    }

    return `${field.label}: ${field.value}`;
  }

  if (field.kind === "select") {
    if (!field.value || field.value === field.defaultValue) {
      return null;
    }

    const selectedOption = field.options.find((option) => option.value === field.value);

    return selectedOption ? `${field.label}: ${selectedOption.label}` : `${field.label}: ${field.value}`;
  }

  if (field.value.length === 0 && field.defaultValue.length === 0) {
    return null;
  }

  if (arraysMatch(field.value, field.defaultValue)) {
    return null;
  }

  const selectedLabels = field.value
    .map((value) => field.options.find((option) => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));

  if (selectedLabels.length === 0) {
    return null;
  }

  if (selectedLabels.length === 1) {
    return `${field.label}: ${selectedLabels[0]}`;
  }

  if (selectedLabels.length === 2) {
    return `${field.label}: ${selectedLabels[0]}, ${selectedLabels[1]}`;
  }

  return `${field.label}: ${selectedLabels[0]} +${selectedLabels.length - 1}`;
}

function arraysMatch(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}
