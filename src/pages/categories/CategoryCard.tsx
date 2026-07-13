import Card from "../../components/ui/Card";
import { getStoredIcon } from "../../lib/icons";
import { useI18n } from "../../app/i18n/I18nContext";
import type { Category } from "../../app/api/categories";
import styles from "./CategoriesPage.module.scss";

type CategoryCardProps = {
  category: Category;
  isSelected?: boolean;
  onSelect: (id: string) => void;
};

export default function CategoryCard({ category, onSelect }: CategoryCardProps) {
  const { t } = useI18n();
  const Icon = getStoredIcon(category.icon);

  return (
    <Card className={styles.categoryCard}>
      <button
        className={styles.categoryButton}
        onClick={() => onSelect(category.id)}
        style={category.color ? { borderInlineStartColor: category.color } : undefined}
        type="button"
      >
        <div className={styles.categoryCardHeader}>
          <div className={styles.categoryTitleRow}>
            {Icon ? (
              <span aria-hidden="true" className={styles.categoryTitleIcon} style={category.color ? { color: category.color } : undefined}>
                <Icon className={styles.categoryMetaIcon} />
              </span>
            ) : null}
            <strong>{category.name}</strong>
          </div>

          <div className={styles.categoryBadges}>
            <span
              className={category.archivedFromMonth ? `${styles.badge} ${styles.badgeMuted}` : `${styles.badge} ${styles.badgeSuccess}`}
            >
              {category.archivedFromMonth ? t("common.archived") : t("common.active")}
            </span>
          </div>
        </div>
      </button>
    </Card>
  );
}
