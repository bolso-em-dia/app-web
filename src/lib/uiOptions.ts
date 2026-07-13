import type { Translate } from "../app/i18n/I18nContext";
import type { StoredIconId } from "./icons";

export type ColorOption = {
  value: string;
  label: string;
};

export type IconOption = {
  value: StoredIconId;
  label: string;
};

const COLOR_OPTION_KEYS = [
  { value: "#ef4444", key: "ui.colors.red" },
  { value: "#f97316", key: "ui.colors.orange" },
  { value: "#f59e0b", key: "ui.colors.amber" },
  { value: "#eab308", key: "ui.colors.yellow" },
  { value: "#84cc16", key: "ui.colors.lime" },
  { value: "#22c55e", key: "ui.colors.green" },
  { value: "#10b981", key: "ui.colors.emerald" },
  { value: "#14b8a6", key: "ui.colors.teal" },
  { value: "#06b6d4", key: "ui.colors.cyan" },
  { value: "#0ea5e9", key: "ui.colors.sky" },
  { value: "#3b82f6", key: "ui.colors.blue" },
  { value: "#6366f1", key: "ui.colors.indigo" },
  { value: "#8b5cf6", key: "ui.colors.violet" },
  { value: "#a855f7", key: "ui.colors.purple" },
  { value: "#d946ef", key: "ui.colors.fuchsia" },
  { value: "#ec4899", key: "ui.colors.pink" },
  { value: "#f43f5e", key: "ui.colors.rose" },
  { value: "#78716c", key: "ui.colors.stone" },
  { value: "#6b7280", key: "ui.colors.gray" },
  { value: "#1f2937", key: "ui.colors.graphite" },
] as const satisfies ReadonlyArray<{
  value: string;
  key: Parameters<Translate>[0];
}>;

const ICON_OPTION_KEYS = [
  { value: "shopping-cart", key: "ui.icons.shoppingCart" },
  { value: "car", key: "ui.icons.car" },
  { value: "home", key: "ui.icons.home" },
  { value: "heart", key: "ui.icons.health" },
  { value: "briefcase", key: "ui.icons.work" },
  { value: "credit-card", key: "ui.icons.payment" },
  { value: "plane", key: "ui.icons.travel" },
  { value: "gift", key: "ui.icons.gifts" },
  { value: "book", key: "ui.icons.education" },
  { value: "coffee", key: "ui.icons.leisure" },
  { value: "smartphone", key: "ui.icons.technology" },
  { value: "gamepad", key: "ui.icons.games" },
  { value: "shirt", key: "ui.icons.clothes" },
  { value: "school", key: "ui.icons.school" },
  { value: "dumbbell", key: "ui.icons.fitness" },
  { value: "pill", key: "ui.icons.pharmacy" },
  { value: "sparkles", key: "ui.icons.personalCare" },
  { value: "hand-coins", key: "ui.icons.loans" },
  { value: "shopping-basket", key: "ui.icons.groceries" },
  { value: "paw-print", key: "ui.icons.pets" },
  { value: "wrench", key: "ui.icons.services" },
] as const satisfies ReadonlyArray<{
  value: StoredIconId;
  key: Parameters<Translate>[0];
}>;

export function buildColorOptions(t: Translate): ColorOption[] {
  return COLOR_OPTION_KEYS.map((option) => ({
    value: option.value,
    label: t(option.key),
  }));
}

export function buildIconOptions(t: Translate): IconOption[] {
  return ICON_OPTION_KEYS.map((option) => ({
    value: option.value,
    label: t(option.key),
  }));
}

export function getColorLabel(value: string | null | undefined, t: Translate) {
  return buildColorOptions(t).find((option) => option.value === value)?.label ?? null;
}
