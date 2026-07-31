export type SortDirection = "asc" | "desc";

export type SortValue<TSortBy extends string> = {
  sortBy: TSortBy;
  sortDir: SortDirection;
};

export type SortOption<TSortBy extends string> = SortValue<TSortBy> & {
  label: string;
};

export function isSortDirection(value: string | null): value is SortDirection {
  return value === "asc" || value === "desc";
}
