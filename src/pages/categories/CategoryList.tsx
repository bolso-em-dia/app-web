import type { Category } from "../../app/api/categories";
import CategoryCard from "./CategoryCard";
import styles from "./CategoriesPage.module.scss";

interface CategoryListProps {
  categories: Category[];
  selectedId: string | null;
  onCardSelect: (id: string, category: Category) => void;
}

export default function CategoryList({
  categories,
  selectedId,
  onCardSelect,
}: CategoryListProps) {
  return (
    <section className={styles.categoryGrid}>
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          isSelected={selectedId === category.id}
          onSelect={(id) => onCardSelect(id, category)}
        />
      ))}
    </section>
  );
}
