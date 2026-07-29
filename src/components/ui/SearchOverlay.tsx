import { useI18n } from "../../app/i18n/I18nContext";
import styles from "./SearchOverlay.module.scss";

type SearchOverlayProps = {
  /** Called when the user taps/clicks anywhere on the overlay. */
  onDismiss: () => void;
};

/**
 * Transparent full-viewport overlay that sits between page content and the
 * mobile search dock (z-index 24, between action bar at 20 and dock at 25).
 *
 * Its sole purpose is to capture taps/clicks that would otherwise hit page
 * content behind the dock, dismissing the search and hiding the keyboard
 * instead of triggering unintended actions (create, navigate, select, etc.).
 */
export default function SearchOverlay({ onDismiss }: SearchOverlayProps) {
  const { t } = useI18n();

  return <button aria-label={t("common.closeSearch")} className={styles.overlay} onClick={onDismiss} type="button" />;
}
