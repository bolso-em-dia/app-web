import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../app/auth/useAuth";
import styles from "./HomePage.module.scss";

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <AppShell
      title="Home"
      subtitle="Initial web application skeleton"
      actions={
        <Button onClick={() => void logout()} type="button" variant="secondary">
          Sign out
        </Button>
      }
    >
      <section className={styles.grid}>
        <Card className={styles.panel}>
          <h2 className={styles.panelTitle}>Sessão</h2>
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
          <h2 className={styles.panelTitle}>Next steps</h2>
          <ul className={styles.list}>
            <li>Connect the real dashboard API.</li>
            <li>Add navigation for the phase 1 entities.</li>
            <li>Expand authentication and session flows.</li>
          </ul>
        </Card>
      </section>
    </AppShell>
  );
}
