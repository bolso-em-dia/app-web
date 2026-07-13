import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../../app/i18n/I18nContext";
import Button from "./Button";
import styles from "./SimplePagination.module.scss";

type SimplePaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function SimplePagination({ page, totalPages, onPageChange }: SimplePaginationProps) {
  const { t } = useI18n();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={styles.root}>
      <Button type="button" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft />
      </Button>
      <span>
        {t("common.pageOf", {
          page: page + 1,
          total: totalPages,
        })}
      </span>
      <Button type="button" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
        <ChevronRight />
      </Button>
    </div>
  );
}
