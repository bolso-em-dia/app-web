import type { Ref } from "react";
import { useI18n } from "../../app/i18n/I18nContext";
import Button from "./Button";
import Card from "./Card";
import styles from "./PaginationBar.module.scss";

type PaginationBarProps = {
  loaded: number;
  total: number;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  error?: string | null;
  onRetry?: () => void;
  sentinelRef?: Ref<HTMLDivElement>;
};

export default function PaginationBar({ loaded, total, isLoadingMore, hasNextPage, error, onRetry, sentinelRef }: PaginationBarProps) {
  const { t } = useI18n();

  let statusLabel = t("common.allItemsLoaded");

  if (error) {
    statusLabel = error;
  } else if (isLoadingMore) {
    statusLabel = t("common.loadingMore");
  } else if (hasNextPage) {
    statusLabel = t("common.scrollToLoadMore");
  }

  return (
    <Card className={styles.footerPanel}>
      <div className={styles.footer}>
        <p className={styles.rangeLabel}>{t("common.loadedItems", { loaded, total })}</p>

        <div className={styles.statusArea}>
          <span className={styles.statusLabel}>{statusLabel}</span>
          {error && onRetry ? (
            <Button onClick={onRetry} type="button" variant="subtle">
              {t("common.retry")}
            </Button>
          ) : null}
        </div>
      </div>

      <div aria-hidden="true" className={styles.sentinel} ref={sentinelRef} />
    </Card>
  );
}
