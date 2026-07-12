import type { Budget } from "../../app/api/budgets";
import Card from "../../components/ui/Card";
import BudgetCard from "./BudgetCard";
import styles from "./BudgetsPage.module.scss";

interface BudgetListProps {
  budgets: Budget[];
  selectedId: string | null;
  onCardSelect: (id: string, budget: Budget) => void;
  emptyMessage: string;
}

export default function BudgetList({
  budgets,
  selectedId,
  onCardSelect,
  emptyMessage,
}: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <section className={styles.budgetGrid}>
        <Card className={styles.emptyState}>
          <p>{emptyMessage}</p>
        </Card>
      </section>
    );
  }

  return (
    <section className={styles.budgetGrid}>
      {budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          isSelected={selectedId === budget.id}
          onSelect={(id) => onCardSelect(id, budget)}
        />
      ))}
    </section>
  );
}
