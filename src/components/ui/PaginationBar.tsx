import { useI18n } from "../../app/i18n/I18nContext";
import Button from "./Button";
import Card from "./Card";
import Select from "./Select";
import styles from "./PaginationBar.module.scss";

type PaginationBarProps = {
  start: number;
  end: number;
  total: number;
  pageSize: number;
  pageSizeOptions?: number[];
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPageSizeChange: (size: number) => void;
  showPageIndicator?: boolean;
  page?: number;
  totalPages?: number;
};

export default function PaginationBar({
  start,
  end,
  total,
  pageSize,
  pageSizeOptions = [12, 24, 48],
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onPageSizeChange,
  showPageIndicator = false,
  page,
  totalPages,
}: PaginationBarProps) {
  const { t } = useI18n();

  return (
    <Card className={styles.footerPanel}>
      <div className={styles.footer}>
        <p className={styles.rangeLabel}>{t("common.range", { start, end, total })}</p>

        <div className={styles.paginationControls}>
          <label className={styles.rowsControl}>
            <span>{t("common.rows")}</span>
            <Select onChange={(e) => onPageSizeChange(Number(e.target.value))} value={String(pageSize)}>
              {pageSizeOptions.map((size) => (
                <option key={size} value={String(size)}>
                  {size}
                </option>
              ))}
            </Select>
          </label>

          <div className={styles.paginationButtons}>
            <Button disabled={!hasPrevious} onClick={onPrevious} type="button" variant="subtle">
              {t("common.previous")}
            </Button>
            {showPageIndicator && page != null && totalPages != null ? (
              <span className={styles.pageIndicator}>{t("common.pageOf", { page, total: totalPages })}</span>
            ) : null}
            <Button disabled={!hasNext} onClick={onNext} type="button" variant="subtle">
              {t("common.next")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
