import { useMemo } from "react";
import { listFamilyMemberPage, type FamilyMember } from "../../app/api/family";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import Spinner from "../../components/feedback/Spinner";
import Card from "../../components/ui/Card";
import PaginationBar from "../../components/ui/PaginationBar";
import { DEFAULT_PAGE_SIZE, type StatusFilter } from "../../lib/constants";
import { useInfinitePageList } from "../../lib/useInfinitePageList";
import FamilyMemberCard from "./FamilyMemberCard";
import styles from "./FamilyPage.module.scss";

interface FamilyMemberListProps {
  filters: { search: string; status: StatusFilter };
  selectedId: string | null;
  onSelect: (id: string, member: FamilyMember) => void;
  refreshKey: number;
}

export default function FamilyMemberList({ filters, selectedId, onSelect, refreshKey }: FamilyMemberListProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const queryKey = useMemo(() => JSON.stringify({ ...filters, refreshKey }), [filters, refreshKey]);
  const {
    items: members,
    totalItems,
    isInitialLoading,
    hasNextPage,
    isLoadingMore,
    error,
    retry,
    sentinelRef,
  } = useInfinitePageList<FamilyMember>({
    enabled: Boolean(accessToken),
    queryKey,
    initialPageSize: DEFAULT_PAGE_SIZE,
    loadPage: (page, size) => listFamilyMemberPage({ page, size, search: filters.search, status: filters.status }, accessToken!),
  });
  const listError = error ? t("family.error") : null;

  if (isInitialLoading) {
    return (
      <Card className={styles.loadingCard}>
        <Spinner label={t("family.loading")} />
      </Card>
    );
  }

  if (members.length === 0 && !listError) {
    return (
      <section className={styles.memberGrid}>
        <Card className={styles.emptyState}>
          <p>{t("family.empty")}</p>
        </Card>
      </section>
    );
  }

  return (
    <>
      <section className={styles.memberGrid}>
        {members.map((member) => (
          <FamilyMemberCard
            key={member.id}
            member={member}
            isSelected={member.id === selectedId}
            onSelect={() => onSelect(member.id, member)}
          />
        ))}
      </section>

      {listError ? <p>{listError}</p> : null}

      <PaginationBar
        loaded={members.length}
        total={totalItems}
        isLoadingMore={isLoadingMore}
        hasNextPage={hasNextPage}
        error={listError}
        onRetry={retry}
        sentinelRef={sentinelRef}
      />
    </>
  );
}
