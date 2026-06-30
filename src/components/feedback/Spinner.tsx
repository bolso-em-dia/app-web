import { useI18n } from "../../app/i18n/I18nContext";
import styles from "./Spinner.module.scss";

type SpinnerProps = {
  label?: string;
  fullScreen?: boolean;
};

export default function Spinner({ label, fullScreen = false }: SpinnerProps) {
  const { t } = useI18n();

  return (
    <div className={fullScreen ? styles.fullScreen : styles.inline}>
      <div aria-hidden="true" className={styles.indicator} />
      <span className={styles.label}>{label ?? t("common.loading")}</span>
    </div>
  );
}
