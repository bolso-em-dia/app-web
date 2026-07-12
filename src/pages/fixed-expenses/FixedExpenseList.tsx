import type { FixedExpenseTemplate } from "../../app/api/fixedExpenses";
import type { CategoryOption } from "../../app/api/categories";
import FixedExpenseCard from "./FixedExpenseCard";
import styles from "./FixedExpensesPage.module.scss";

interface FixedExpenseListProps {
  templates: FixedExpenseTemplate[];
  selectedId: string | null;
  categoryOptionsById: Map<string, CategoryOption>;
  onCardSelect: (id: string, template: FixedExpenseTemplate) => void;
}

export default function FixedExpenseList({
  templates,
  selectedId,
  categoryOptionsById,
  onCardSelect,
}: FixedExpenseListProps) {
  return (
    <section className={styles.templateGrid}>
      {templates.map((template) => (
        <FixedExpenseCard
          key={template.id}
          categoryOption={categoryOptionsById.get(template.categoryId)}
          isSelected={selectedId === template.id}
          template={template}
          onSelect={(id) => onCardSelect(id, template)}
        />
      ))}
    </section>
  );
}
