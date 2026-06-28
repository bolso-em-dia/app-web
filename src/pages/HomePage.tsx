import AppShell from "../components/layout/AppShell";
import { useAuth } from "../app/auth/AuthContext";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <AppShell
      title="Home"
      subtitle="Esqueleto inicial do painel web"
      actions={
        <button className={styles.logoutButton} onClick={() => void logout()} type="button">
          Sair
        </button>
      }
    >
      <section className={styles.grid}>
        <article className={styles.panel}>
          <h2 className={styles.panelTitle}>Sessão</h2>
          <dl className={styles.definitionList}>
            <div>
              <dt>Nome</dt>
              <dd>{user?.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Papel</dt>
              <dd>{user?.role}</dd>
            </div>
          </dl>
        </article>

        <article className={styles.panel}>
          <h2 className={styles.panelTitle}>Próximos passos</h2>
          <ul className={styles.list}>
            <li>Conectar o dashboard real.</li>
            <li>Adicionar navegação das entidades da fase 1.</li>
            <li>Expandir autenticação e sessões.</li>
          </ul>
        </article>
      </section>
    </AppShell>
  );
}
