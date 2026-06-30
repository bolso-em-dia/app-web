import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../app/auth/useAuth";
import {
  managementNavigation,
  primaryNavigation,
} from "../../app/navigation/navigation";
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
  const initials = user?.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <span className={styles.brand}>My Money</span>
          <p className={styles.brandCopy}>
            Family finance workflow for the current implementation phase.
          </p>
        </div>

        <nav className={styles.navigation} aria-label="Primary navigation">
          <div className={styles.navSection}>
            <span className={styles.navSectionTitle}>Overview</span>
            {primaryNavigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? `${styles.navItem} ${styles.navItemActive}`
                    : styles.navItem
                }
              >
                <span className={styles.navLabel}>{item.label}</span>
                <span className={styles.navDescription}>
                  {item.description}
                </span>
              </NavLink>
            ))}
          </div>

          <div className={styles.navSection}>
            <span className={styles.navSectionTitle}>Management</span>
            {managementNavigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? `${styles.navItem} ${styles.navItemActive}`
                    : styles.navItem
                }
              >
                <span className={styles.navLabel}>{item.label}</span>
                <span className={styles.navDescription}>
                  {item.description}
                </span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className={styles.profileCard}>
          <div className={styles.avatar}>{initials || "MM"}</div>
          <div className={styles.profileText}>
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
            <span>{user?.role}</span>
          </div>
          <Button
            onClick={() => void logout()}
            type="button"
            variant="secondary"
          >
            Sign out
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
