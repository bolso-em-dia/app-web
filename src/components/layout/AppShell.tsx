import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import {
  managementNavigation,
  operationalNavigation,
} from "../../app/navigation/navigation";
import { getNavigationIcon } from "../../lib/icons";
import Button from "../ui/Button";
import styles from "./AppShell.module.scss";

type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function AppShell({
  title,
  subtitle,
  actions,
  children,
}: AppShellProps) {
  const { logout, user } = useAuth();
  const { t } = useI18n();
  const initials = user?.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <span className={styles.brand}>{t("app.brand")}</span>
        </div>

        <nav className={styles.navigation} aria-label={t("navigation.aria")}>
          <div className={styles.navSection}>
            {operationalNavigation.map((item) => {
              const Icon = getNavigationIcon(item.iconId);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    isActive
                      ? `${styles.navItem} ${styles.navItemActive}`
                      : styles.navItem
                  }
                >
                  <span className={styles.navLead}>
                    <Icon aria-hidden="true" className={styles.navIcon} />
                    <span className={styles.navLabel}>{t(item.labelKey)}</span>
                  </span>
                </NavLink>
              );
            })}
          </div>

          <div className={styles.navSection}>
            <span className={styles.navSectionTitle}>
              {t("navigation.management")}
            </span>
            {managementNavigation.map((item) => {
              const Icon = getNavigationIcon(item.iconId);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    isActive
                      ? `${styles.navItem} ${styles.navItemActive}`
                      : styles.navItem
                  }
                >
                  <span className={styles.navLead}>
                    <Icon aria-hidden="true" className={styles.navIcon} />
                    <span className={styles.navLabel}>{t(item.labelKey)}</span>
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className={styles.profileCard}>
          <div className={styles.avatar}>{initials || "MM"}</div>
          <div className={styles.profileText}>
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
            <span>
              {user?.role
                ? t(user.role === "ADMIN" ? "roles.ADMIN" : "roles.USER")
                : null}
            </span>
          </div>
          <Button
            onClick={() => void logout()}
            type="button"
            variant="secondary"
          >
            {t("common.signOut")}
          </Button>
        </div>
      </aside>

      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
