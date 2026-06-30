import Card from "../components/ui/Card";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../app/auth/useAuth";
import styles from "./HomePage.module.scss";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <AppShell
      title="Dashboard"
      subtitle="Authenticated workspace shell for the phase 1 finance modules."
    >
      <section className={styles.grid}>
        <Card className={styles.panel}>
          <h2 className={styles.panelTitle}>Session</h2>
          <dl className={styles.definitionList}>
            <div>
              <dt>Name</dt>
              <dd>{user?.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user?.role}</dd>
            </div>
          </dl>
        </Card>

        <Card className={styles.panel}>
          <h2 className={styles.panelTitle}>Shell status</h2>
          <ul className={styles.list}>
            <li>Navigation for the phase 1 areas is in place.</li>
            <li>The authenticated shell is ready for feature pages.</li>
            <li>The next logical step is the real dashboard integration.</li>
          </ul>
        </Card>
      </section>
    </AppShell>
  );
}
