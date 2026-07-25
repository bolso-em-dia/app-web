import { LogOut, Menu, Plus, Search, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import { managementNavigation, operationalNavigation } from "../../app/navigation/navigation";
import { getNavigationIcon } from "../../lib/icons";
import { useBreakpoint } from "../../lib/useBreakpoint";
import clsx from "../ui/clsx";
import Button from "../ui/Button";
import Drawer from "../ui/Drawer";
import AppVersion from "../ui/AppVersion";
import ExchangeRateIndicator from "../ui/ExchangeRateIndicator";
import styles from "./AppShell.module.scss";

type AppShellMobileActions = {
  createLabel?: string;
  onCreate?: () => void;
  onSearch?: () => void;
};

type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  mobileActions?: AppShellMobileActions;
  mobileActionBarHidden?: boolean;
};

export default function AppShell({ title, subtitle, actions, children, mobileActions, mobileActionBarHidden = false }: AppShellProps) {
  const { logout, user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const isCompactNavigation = useBreakpoint(1024);
  const isMobileActionLayout = useBreakpoint(640);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const showMobileActionBar = isMobileActionLayout && !mobileActionBarHidden;
  const currentNavigationItem = [...operationalNavigation, ...managementNavigation].find((item) => item.path === location.pathname);
  const CurrentPageIcon = currentNavigationItem ? getNavigationIcon(currentNavigationItem.iconId) : null;

  useEffect(() => {
    if (!isCompactNavigation) {
      setIsNavigationOpen(false);
    }
  }, [isCompactNavigation]);

  function renderNavigationSection(title: string | null, items: typeof operationalNavigation) {
    return (
      <div className={title ? styles.navSection : `${styles.navSection} ${styles.navSectionUngrouped}`}>
        {title ? <span className={styles.navSectionTitle}>{title}</span> : null}
        {items.map((item) => {
          const Icon = getNavigationIcon(item.iconId);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem)}
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
    );
  }

  function renderNavigation() {
    return (
      <nav className={styles.navigation} aria-label={t("navigation.aria")}>
        {renderNavigationSection(null, operationalNavigation)}
        {renderNavigationSection(t("navigation.management"), managementNavigation)}
      </nav>
    );
  }

  function renderAccountSection() {
    return (
      <div className={styles.profileCard}>
        <div className={styles.profileText}>
          <strong>{user?.name}</strong>
          <span>{user?.role ? t(user.role === "ADMIN" ? "roles.ADMIN" : "roles.USER") : null}</span>
        </div>
        <div className={styles.profileActions}>
          <Link aria-label={t("settings.title")} className={styles.accountAction} title={t("settings.title")} to="/settings">
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
          <ExchangeRateIndicator />
          {renderAccountSection()}
        </aside>
      ) : null}

      <div className={clsx(styles.page, showMobileActionBar ? styles.pageWithMobileActionBar : "")}>
        <header className={styles.header}>
          <div className={styles.headerLead}>
            {isCompactNavigation && CurrentPageIcon && currentNavigationItem ? (
              <span aria-label={t(currentNavigationItem.labelKey)} className={styles.pageIconBadge}>
                <CurrentPageIcon aria-hidden="true" className={styles.pageIcon} />
              </span>
            ) : null}

            <div className={styles.heading}>
              <h1 className={styles.title}>{title}</h1>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
          </div>
          {actions && !isMobileActionLayout ? <div className={styles.actions}>{actions}</div> : null}
        </header>
        <main className={styles.content}>{children}</main>
      </div>

      {isCompactNavigation && isNavigationOpen ? (
        <Drawer hideHeaderCloseButton onClose={() => setIsNavigationOpen(false)} title={t("app.brand")}>
          <div className={styles.mobileNavContent}>
            {renderNavigation()}
            <ExchangeRateIndicator />
            {renderAccountSection()}
            <Button fullWidth onClick={() => setIsNavigationOpen(false)} type="button" variant="secondary">
              {t("common.close")}
            </Button>
          </div>
        </Drawer>
      ) : null}
      {showMobileActionBar ? (
        <div className={styles.mobileActionBar}>
          <button
            aria-label={t("common.menu")}
            className={styles.mobileActionButton}
            onClick={() => setIsNavigationOpen(true)}
            title={t("common.menu")}
            type="button"
          >
            <Menu aria-hidden="true" className={styles.mobileActionIcon} />
          </button>
          {mobileActions?.onCreate ? (
            <button
              aria-label={mobileActions.createLabel ?? t("common.create")}
              className={styles.mobileActionButton}
              onClick={mobileActions.onCreate}
              title={mobileActions.createLabel ?? t("common.create")}
              type="button"
            >
              <Plus aria-hidden="true" className={styles.mobileActionIcon} />
            </button>
          ) : null}
          {mobileActions?.onSearch ? (
            <button
              aria-label={t("common.search")}
              className={styles.mobileActionButton}
              onClick={mobileActions.onSearch}
              title={t("common.search")}
              type="button"
            >
              <Search aria-hidden="true" className={styles.mobileActionIcon} />
            </button>
          ) : null}
        </div>
      ) : null}
      <AppVersion />
    </div>
  );
}
