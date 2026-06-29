import styles from "./Spinner.module.scss";

type SpinnerProps = {
  label?: string;
  fullScreen?: boolean;
};

export default function Spinner({
  label = "Loading...",
  fullScreen = false,
}: SpinnerProps) {
  return (
    <div className={fullScreen ? styles.fullScreen : styles.inline}>
      <div aria-hidden="true" className={styles.indicator} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
