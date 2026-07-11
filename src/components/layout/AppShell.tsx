import { LogOut, Menu, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import {
  managementNavigation,
  operationalNavigation,
} from "../../app/navigation/navigation";
import { getNavigationIcon } from "../../lib/icons";
import Button from "../ui/Button";
import Drawer from "../ui/Drawer";
import ExchangeRateIndicator from "../ui/ExchangeRateIndicator";
import styles from "./AppShell.module.scss";

type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

function useCompactNavigation() {
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false,
  );

  useEffect(() => {
    function handleResize() {
      setIsCompact(window.innerWidth <= 1024);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isCompact;
}

export default function AppShell({
  title,
  subtitle,
  actions,
  children,
}: AppShellProps) {
  const { logout, user } = useAuth();
  const { t } = useI18n();
  const isCompactNavigation = useCompactNavigation();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  useEffect(() => {
    if (!isCompactNavigation) {
      setIsNavigationOpen(false);
    }
  }, [isCompactNavigation]);

  function renderNavigation() {
    return (
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
                onClick={() => setIsNavigationOpen(false)}
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
                onClick={() => setIsNavigationOpen(false)}
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
    );
  }

  function renderAccountSection() {
    return (
      <div className={styles.profileCard}>
        <div className={styles.profileText}>
          <strong>{user?.name}</strong>
          <span>
            {user?.role
              ? t(user.role === "ADMIN" ? "roles.ADMIN" : "roles.USER")
              : null}
          </span>
        </div>
        <div className={styles.profileActions}>
          <Link
            aria-label={t("settings.title")}
            className={styles.accountAction}
            title={t("settings.title")}
            to="/settings"
          >
            <UserRound aria-hidden="true" className={styles.accountActionIcon} />
          </Link>
          <Button onClick={() => void logout()} type="button" variant="subtle">
            <LogOut aria-hidden="true" className={styles.signOutIcon} />
            {t("common.signOut")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      {!isCompactNavigation ? (
        <aside className={styles.sidebar}>
          <div className={styles.brandBlock}>
            <span className={styles.brand}>{t("app.brand")}</span>
          </div>

          {renderNavigation()}
          {renderAccountSection()}
        </aside>
      ) : null}

      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerLead}>
            {isCompactNavigation ? (
              <Button
                aria-label={t("navigation.aria")}
                className={styles.menuButton}
                onClick={() => setIsNavigationOpen(true)}
                type="button"
                variant="subtle"
              >
                <Menu aria-hidden="true" className={styles.menuIcon} />
              </Button>
            ) : null}

            <div className={styles.heading}>
              <h1 className={styles.title}>{title}</h1>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
          </div>
          <ExchangeRateIndicator />
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
        <main className={styles.content}>{children}</main>
      </div>

      {isCompactNavigation && isNavigationOpen ? (
        <Drawer onClose={() => setIsNavigationOpen(false)} title={t("app.brand")}>
          <div className={styles.mobileNavContent}>
            {renderNavigation()}
            {renderAccountSection()}
          </div>
        </Drawer>
      ) : null}
    </div>
  );
}
