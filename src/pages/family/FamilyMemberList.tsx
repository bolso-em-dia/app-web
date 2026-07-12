import type { FamilyMember } from "../../app/api/family";
import Card from "../../components/ui/Card";
import FamilyMemberCard from "./FamilyMemberCard";
import styles from "./FamilyPage.module.scss";

interface FamilyMemberListProps {
  members: FamilyMember[];
  selectedId: string | null;
  onCardSelect: (id: string, member: FamilyMember) => void;
  emptyMessage: string;
}

export default function FamilyMemberList({
  members,
  selectedId,
  onCardSelect,
  emptyMessage,
}: FamilyMemberListProps) {
  if (members.length === 0) {
    return (
      <section className={styles.memberGrid}>
        <Card className={styles.emptyState}>
          <p>{emptyMessage}</p>
        </Card>
      </section>
    );
  }

  return (
    <section className={styles.memberGrid}>
      {members.map((member) => (
        <FamilyMemberCard
          key={member.id}
          member={member}
          isSelected={member.id === selectedId}
          onSelect={() => onCardSelect(member.id, member)}
        />
      ))}
    </section>
  );
}
