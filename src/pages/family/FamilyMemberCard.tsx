import { useI18n } from "../../app/i18n/I18nContext";
import Card from "../../components/ui/Card";
import styles from "./FamilyPage.module.scss";
import type { FamilyMember } from "../../app/api/family";

type FamilyMemberCardProps = {
  member: FamilyMember;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

export default function FamilyMemberCard({
  member,
  isSelected,
  onSelect,
}: FamilyMemberCardProps) {
  const { t } = useI18n();

  return (
    <Card key={member.id} className={styles.memberCard}>
      <button
        className={styles.memberButton}
        onClick={() => onSelect(member.id)}
        type="button"
      >
        <div className={styles.memberHeader}>
          <div>
            <strong>{member.name}</strong>
            <p className={styles.memberMeta}>
              {member.email} ·{" "}
              {t(member.role === "ADMIN" ? "roles.ADMIN" : "roles.USER")}
            </p>
          </div>
        </div>

        <div className={styles.memberBadges}>
          <span
            className={
              member.active
                ? `${styles.badge} ${styles.badgeSuccess}`
                : `${styles.badge} ${styles.badgeMuted}`
            }
          >
            {member.active ? t("common.active") : t("common.archived")}
          </span>
          <span className={styles.badge}>
            {t(member.role === "ADMIN" ? "roles.ADMIN" : "roles.USER")}
          </span>
          {member.allowanceEnabled ? (
            <span className={styles.badge}>{t("family.allowance")}</span>
          ) : null}
        </div>
      </button>
    </Card>
  );
}
