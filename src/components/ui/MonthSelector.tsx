import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../../app/i18n/I18nContext";
import {
  isCurrentReferenceMonth,
  shiftReferenceMonth,
} from "../../lib/formatters/date";
import Button from "./Button";
import Input from "./Input";
import styles from "./MonthSelector.module.scss";

function toMonthInputValue(value: string) {
  return value.slice(0, 7);
}

function fromMonthInputValue(value: string) {
  return `${value}-01`;
}

type MonthSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
};

export default function MonthSelector({ value, onChange, id }: MonthSelectorProps) {
  const { t } = useI18n();

  return (
    <div className={styles.monthInputShell}>
      <Button
        aria-label={t("common.previousMonth")}
        className={styles.monthNavButton}
        onClick={() => onChange(shiftReferenceMonth(value, -1))}
        type="button"
        variant="secondary"
      >
        <ChevronLeft aria-hidden="true" size={16} />
      </Button>
      <Input
        className={isCurrentReferenceMonth(value) ? undefined : styles.monthInputHighlighted}
        id={id}
        onChange={(event) => onChange(fromMonthInputValue(event.target.value))}
        type="month"
        value={toMonthInputValue(value)}
      />
      <Button
        aria-label={t("common.nextMonth")}
        className={styles.monthNavButton}
        onClick={() => onChange(shiftReferenceMonth(value, 1))}
        type="button"
        variant="secondary"
      >
        <ChevronRight aria-hidden="true" size={16} />
      </Button>
    </div>
  );
}
