import { memo } from "react";
import { X } from "lucide-react";
import Button from "./Button";
import styles from "./FilterChip.module.scss";

type FilterChipProps = {
  label: string;
  onRemove: () => void;
};

export default memo(function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <Button
      className={styles.root}
      onClick={onRemove}
      type="button"
      variant="subtle"
    >
      <span className={styles.label}>{label}</span>
      <X aria-hidden="true" className={styles.icon} />
    </Button>
  );
});
