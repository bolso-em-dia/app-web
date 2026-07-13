import { Fragment, useMemo } from "react";
import Drawer from "./Drawer";
import Button from "./Button";
import FilterChip from "./FilterChip";
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
};

export default function FilterToolbar({
  fields,
  isPanelOpen,
  onTogglePanel,
  onClosePanel,
  onResetField,
}: FilterToolbarProps) {
  const { t } = useI18n();
  const isCompact = useBreakpoint(960);
  const fieldEntries = useMemo(() => Object.entries(fields), [fields]);
  const visibleFields = useMemo(
    () => fieldEntries.filter(([, field]) => field.placement === "visible"),
    [fieldEntries],
  );
  const expandedFields = useMemo(
    () => fieldEntries.filter(([, field]) => field.placement === "expanded"),
    [fieldEntries],
  );
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
  const filtersLabel =
    activeCount > 0
      ? `${t("common.filters")} (${activeCount})`
      : t("common.filters");

  return (
    <div className={styles.root}>
      <div className={styles.primaryRow}>
        <div className={styles.primaryContent}>
          {visibleFields.map(([name, field]) => (
            <Fragment key={name}>{field.element}</Fragment>
          ))}
        </div>
        <div className={styles.actions}>
          <Button
            aria-expanded={isPanelOpen}
            onClick={onTogglePanel}
            type="button"
            variant="secondary"
          >
            {filtersLabel}
          </Button>
          {activeCount > 0 ? (
            <Button
              onClick={() => {
                fieldEntries.forEach(([name, field]) => {
                  onResetField(name, field.defaultValue);
                });
              }}
              type="button"
              variant="subtle"
            >
              {t("common.clearFilters")}
            </Button>
          ) : null}
        </div>
      </div>

      {activeCount > 0 ? (
        <div className={styles.chips}>
          {activeFilters.map((filter) => (
            <FilterChip
              key={filter.key}
              label={filter.label}
              onRemove={filter.onRemove}
            />
          ))}
        </div>
      ) : null}

      {!isCompact && isPanelOpen ? (
        <div className={styles.panel}>
          {expandedFields.map(([name, field]) => (
            <Fragment key={name}>{field.element}</Fragment>
          ))}
        </div>
      ) : null}

      {isCompact && isPanelOpen ? (
        <Drawer title={t("common.filters")} onClose={onClosePanel}>
          <div className={styles.drawerContent}>
            <div className={styles.panel}>
              {expandedFields.map(([name, field]) => (
                <Fragment key={name}>{field.element}</Fragment>
              ))}
            </div>
            {activeCount > 0 ? (
              <Button
                fullWidth
                onClick={() => {
                  fieldEntries.forEach(([name, field]) => {
                    onResetField(name, field.defaultValue);
                  });
                  onClosePanel();
                }}
                type="button"
                variant="subtle"
              >
                {t("common.clearFilters")}
              </Button>
            ) : null}
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

    const selectedOption = field.options.find(
      (option) => option.value === field.value,
    );

    return selectedOption
      ? `${field.label}: ${selectedOption.label}`
      : `${field.label}: ${field.value}`;
  }

  if (field.value.length === 0 && field.defaultValue.length === 0) {
    return null;
  }

  if (arraysMatch(field.value, field.defaultValue)) {
    return null;
  }

  const selectedLabels = field.value
    .map(
      (value) => field.options.find((option) => option.value === value)?.label,
    )
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
