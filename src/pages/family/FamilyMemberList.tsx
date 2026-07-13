import { useCallback, useEffect, useState } from "react";
import type { FamilyMember } from "../../app/api/family";
import { listFamilyMemberPage } from "../../app/api/family";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import Card from "../../components/ui/Card";
import Spinner from "../../components/feedback/Spinner";
import PaginationBar from "../../components/ui/PaginationBar";
import { DEFAULT_PAGE_SIZE, type StatusFilter } from "../../lib/constants";
import { usePagination } from "../../lib/usePagination";
import FamilyMemberCard from "./FamilyMemberCard";
import styles from "./FamilyPage.module.scss";

interface FamilyMemberListProps {
  filters: { search: string; status: StatusFilter };
  selectedId: string | null;
  onSelect: (id: string, member: FamilyMember) => void;
  refreshKey: number;
}

export default function FamilyMemberList({
  filters,
  selectedId,
  onSelect,
  refreshKey,
}: FamilyMemberListProps) {
  const { accessToken } = useAuth();
  const { t } = useI18n();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const loadMembers = useCallback(
    async (
      pageNum: number,
      size: number,
      query: string,
      status: StatusFilter,
    ) => {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await listFamilyMemberPage(
          { page: pageNum, size, search: query, status },
          accessToken,
        );
        setMembers(response.items);
        setPage(response.page);
        setPageSize(response.size);
        setTotalItems(response.totalItems);
      } catch {
        setMembers([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    void loadMembers(page, pageSize, filters.search, filters.status);
  }, [loadMembers, page, pageSize, filters.search, filters.status, refreshKey]);

  useEffect(() => {
    setPage(0);
  }, [filters.search, filters.status]);

  const showInitialLoading = isLoading && !hasLoadedOnce;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const pagination = usePagination(page, pageSize, totalItems, totalPages);

  if (showInitialLoading) {
    return (
      <Card className={styles.loadingCard}>
        <Spinner label={t("family.loading")} />
      </Card>
    );
  }

  if (members.length === 0) {
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

      <PaginationBar
        start={pagination.rangeStart}
        end={pagination.rangeEnd}
        total={totalItems}
        pageSize={pageSize}
        hasPrevious={pagination.hasPreviousPage}
        hasNext={pagination.hasNextPage}
        onPrevious={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(0);
        }}
      />
    </>
  );
}
