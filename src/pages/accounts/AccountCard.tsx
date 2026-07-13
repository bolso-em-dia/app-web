import type { Account } from "../../app/api/accounts";
import { useI18n } from "../../app/i18n/I18nContext";
import Card from "../../components/ui/Card";
import { formatReferenceMonth } from "../../lib/formatters/date";
import styles from "./AccountsPage.module.scss";

interface AccountCardProps {
  account: Account;
  isSelected?: boolean;
  onSelect: (id: string) => void;
}

export default function AccountCard({ account, onSelect }: AccountCardProps) {
  const { t } = useI18n();

  return (
    <Card key={account.id} className={styles.accountCard}>
      <button
        className={styles.accountButton}
        onClick={() => onSelect(account.id)}
        style={account.color ? { borderInlineStartColor: account.color } : undefined}
        type="button"
      >
        <div className={styles.accountHeader}>
          <div>
            <div className={styles.accountTitleRow}>
              {account.color ? <span aria-hidden="true" className={styles.swatchDot} style={{ backgroundColor: account.color }} /> : null}
              <strong>{account.name}</strong>
            </div>
            <p className={styles.accountMeta}>
              {t(`accountTypes.${account.type}` as const)}
              {account.brand ? ` · ${account.brand}` : ""}
            </p>
          </div>
        </div>

        <div className={styles.accountBadges}>
          <span className={styles.badge}>{t(`accountTypes.${account.type}` as const)}</span>
          {account.closingDay && account.dueDay ? (
            <span className={`${styles.badge} ${styles.badgeInfo}`}>
              {t("accounts.billingCycle", {
                closingDay: account.closingDay,
                dueDay: account.dueDay,
              })}
            </span>
          ) : null}
          <span className={account.archivedFromMonth ? `${styles.badge} ${styles.badgeMuted}` : `${styles.badge} ${styles.badgeSuccess}`}>
            {account.archivedFromMonth
              ? t("common.archivedFrom", {
                  month: formatReferenceMonth(account.archivedFromMonth),
                })
              : t("common.active")}
          </span>
        </div>
      </button>
    </Card>
  );
}
