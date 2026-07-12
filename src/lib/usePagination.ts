type UsePaginationReturn = {
  rangeStart: number;
  rangeEnd: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export function usePagination(
  page: number,
  pageSize: number,
  totalItems: number,
  totalPages: number,
): UsePaginationReturn {
  const rangeStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const rangeEnd =
    totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);
  const hasPreviousPage = page > 0;
  const hasNextPage = page + 1 < totalPages;

  return { rangeStart, rangeEnd, hasPreviousPage, hasNextPage };
}
