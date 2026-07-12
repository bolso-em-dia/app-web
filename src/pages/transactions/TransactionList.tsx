import type { Transaction } from "../../app/api/transactions";
import type { CategoryOption } from "../../app/api/categories";
import Card from "../../components/ui/Card";
import TransactionCard from "./TransactionCard";
import styles from "./TransactionsPage.module.scss";

interface TransactionListProps {
  transactions: Transaction[];
  selectedId: string | null;
  categoryOptionsById: Map<string, CategoryOption>;
  onCardSelect: (id: string, transaction: Transaction) => void;
  emptyMessage: string;
}

export default function TransactionList({
  transactions,
  selectedId,
  categoryOptionsById,
  onCardSelect,
  emptyMessage,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <section className={styles.transactionGrid}>
        <Card className={styles.emptyState}>
          <p>{emptyMessage}</p>
        </Card>
      </section>
    );
  }

  return (
    <section className={styles.transactionGrid}>
      {transactions.map((transaction) => {
        const categoryOption = categoryOptionsById.get(transaction.categoryId);
        return (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            categoryOption={categoryOption}
            isSelected={selectedId === transaction.id}
            onSelect={(id) => onCardSelect(id, transaction)}
          />
        );
      })}
    </section>
  );
}
