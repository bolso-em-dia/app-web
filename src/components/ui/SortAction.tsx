import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "../../app/i18n/I18nContext";
import type { SortOption, SortValue } from "../../lib/sorting";
import Button from "./Button";
import Drawer from "./Drawer";
import styles from "./SortAction.module.scss";

type SortActionProps<TSortBy extends string> = {
  className?: string;
  options: SortOption<TSortBy>[];
  value: SortValue<TSortBy>;
  onChange: (value: SortValue<TSortBy>) => void;
};

export default function SortAction<TSortBy extends string>({ className, options, value, onChange }: SortActionProps<TSortBy>) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const activeOption = useMemo(
    () => options.find((option) => option.sortBy === value.sortBy && option.sortDir === value.sortDir) ?? null,
    [options, value.sortBy, value.sortDir],
  );

  return (
    <>
      <Button
        aria-label={activeOption ? t("common.sortWithValue", { value: activeOption.label }) : t("common.sort")}
        className={className ?? styles.root}
        onClick={() => setIsOpen(true)}
        type="button"
        variant="secondary"
      >
        <ArrowUpDown aria-hidden="true" className={styles.icon} />
      </Button>

      {isOpen ? (
        <Drawer title={t("common.sort")} onClose={() => setIsOpen(false)}>
          <div className={styles.content}>
            <div aria-label={t("common.sort")} className={styles.options} role="radiogroup">
              {options.map((option) => {
                const isActive = option.sortBy === value.sortBy && option.sortDir === value.sortDir;

                return (
                  <Button
                    key={`${option.sortBy}-${option.sortDir}`}
                    aria-checked={isActive}
                    className={styles.option}
                    onClick={() => {
                      onChange({ sortBy: option.sortBy, sortDir: option.sortDir });
                      setIsOpen(false);
                    }}
                    role="radio"
                    type="button"
                    variant={isActive ? "primary" : "secondary"}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>

            <Button fullWidth onClick={() => setIsOpen(false)} type="button" variant="secondary">
              {t("common.close")}
            </Button>
          </div>
        </Drawer>
      ) : null}
    </>
  );
}
