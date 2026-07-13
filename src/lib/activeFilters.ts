import type { Translate } from "../app/i18n/I18nContext";
import type { StatusFilter } from "./constants";

export type ActiveFilter = {
  key: string;
  label: string;
  onRemove: () => void;
};

export function buildSearchActiveFilter(
  value: string,
  label: string,
  onRemove: () => void,
): ActiveFilter[] {
  if (!value) {
    return [];
  }

  return [{ key: "search", label: `${label}: ${value}`, onRemove }];
}

export function buildStatusActiveFilter(
  status: StatusFilter,
  t: Translate,
  onRemove: () => void,
  defaultStatus: StatusFilter = "ACTIVE",
): ActiveFilter[] {
  if (status === defaultStatus) {
    return [];
  }

  return [
    {
      key: "status",
      label: `${t("common.status")}: ${t(
        status === "ALL" ? "common.all" : "common.archived",
      )}`,
      onRemove,
    },
  ];
}

export function buildTypeActiveFilter(
  key: string,
  value: string | undefined,
  label: string,
  onRemove: () => void,
): ActiveFilter[] {
  if (!value) {
    return [];
  }

  return [{ key, label, onRemove }];
}

export function compileActiveFilters(chips: ActiveFilter[][]): ActiveFilter[] {
  return chips.flat();
}
