import type { ReactNode } from "react";
import Drawer from "./Drawer";
import Button from "./Button";
import FilterChip from "./FilterChip";
import styles from "./FilterToolbar.module.scss";
import { useI18n } from "../../app/i18n/I18nContext";
import { useBreakpoint } from "../../lib/useBreakpoint";

type ActiveFilter = {
  key: string;
  label: string;
  onRemove: () => void;
};

type FilterToolbarProps = {
  primaryContent: ReactNode;
  secondaryContent: ReactNode;
  activeFilters: ActiveFilter[];
  isPanelOpen: boolean;
  onTogglePanel: () => void;
  onClosePanel: () => void;
  onClearFilters: () => void;
};

export default function FilterToolbar({
  primaryContent,
  secondaryContent,
  activeFilters,
  isPanelOpen,
  onTogglePanel,
  onClosePanel,
  onClearFilters,
}: FilterToolbarProps) {
  const { t } = useI18n();
  const isCompact = useBreakpoint(960);
  const activeCount = activeFilters.length;
  const filtersLabel =
    activeCount > 0
      ? `${t("common.filters")} (${activeCount})`
      : t("common.filters");

  return (
    <div className={styles.root}>
      <div className={styles.primaryRow}>
        <div className={styles.primaryContent}>{primaryContent}</div>
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
            <Button onClick={onClearFilters} type="button" variant="subtle">
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
        <div className={styles.panel}>{secondaryContent}</div>
      ) : null}

      {isCompact && isPanelOpen ? (
        <Drawer title={t("common.filters")} onClose={onClosePanel}>
          <div className={styles.drawerContent}>
            <div className={styles.panel}>{secondaryContent}</div>
            {activeCount > 0 ? (
              <Button
                fullWidth
                onClick={() => {
                  onClearFilters();
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
