import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import styles from "./PlaceholderPage.module.scss";

type PlaceholderPageProps = {
  title: string;
  subtitle: string;
};

export default function PlaceholderPage({
  title,
  subtitle,
}: PlaceholderPageProps) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      <section className={styles.grid}>
        <Card className={styles.panel}>
          <h2 className={styles.panelTitle}>Planned area</h2>
          <p className={styles.body}>
            This section is part of the phase 1 web structure and is ready for
            the feature-specific implementation.
          </p>
        </Card>

        <Card className={styles.panel}>
          <h2 className={styles.panelTitle}>Next implementation step</h2>
          <p className={styles.body}>
            Build the data flow, page interactions, and CRUD forms for this
            feature on top of the authenticated shell.
          </p>
        </Card>
      </section>
    </AppShell>
  );
}
