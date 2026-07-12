import type { Account } from "../../app/api/accounts";
import Card from "../../components/ui/Card";
import AccountCard from "./AccountCard";
import styles from "./AccountsPage.module.scss";

interface AccountListProps {
  accounts: Account[];
  selectedId: string | null;
  onCardSelect: (id: string, account: Account) => void;
  emptyMessage: string;
}

export default function AccountList({
  accounts,
  selectedId,
  onCardSelect,
  emptyMessage,
}: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <section className={styles.accountGrid}>
        <Card className={styles.emptyState}>
          <p>{emptyMessage}</p>
        </Card>
      </section>
    );
  }

  return (
    <section className={styles.accountGrid}>
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          isSelected={selectedId === account.id}
          onSelect={(id) => onCardSelect(id, account)}
        />
      ))}
    </section>
  );
}
