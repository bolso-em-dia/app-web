import type { StoredIconId } from "./icons";

export type ColorOption = {
  value: string;
  label: string;
};

export type IconOption = {
  value: StoredIconId;
  label: string;
};

export const COLOR_OPTIONS: ColorOption[] = [
  { value: "#ef4444", label: "Vermelho" },
  { value: "#f97316", label: "Laranja" },
  { value: "#f59e0b", label: "Âmbar" },
  { value: "#eab308", label: "Amarelo" },
  { value: "#84cc16", label: "Lima" },
  { value: "#22c55e", label: "Verde" },
  { value: "#10b981", label: "Esmeralda" },
  { value: "#14b8a6", label: "Turquesa" },
  { value: "#06b6d4", label: "Ciano" },
  { value: "#0ea5e9", label: "Azul claro" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#6366f1", label: "Índigo" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#a855f7", label: "Roxo" },
  { value: "#d946ef", label: "Fúcsia" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#f43f5e", label: "Rose" },
  { value: "#78716c", label: "Pedra" },
  { value: "#6b7280", label: "Cinza" },
  { value: "#1f2937", label: "Grafite" },
];

export const ICON_OPTIONS: IconOption[] = [
  { value: "shopping-cart", label: "Compras" },
  { value: "car", label: "Transporte" },
  { value: "home", label: "Casa" },
  { value: "heart", label: "Saúde" },
  { value: "briefcase", label: "Trabalho" },
  { value: "credit-card", label: "Pagamento" },
  { value: "plane", label: "Viagem" },
  { value: "gift", label: "Presentes" },
  { value: "book", label: "Educação" },
  { value: "coffee", label: "Lazer" },
  { value: "smartphone", label: "Tecnologia" },
  { value: "gamepad", label: "Jogos" },
  { value: "shirt", label: "Roupas" },
  { value: "school", label: "Escola" },
  { value: "dumbbell", label: "Fitness" },
  { value: "pill", label: "Farmácia" },
  { value: "sparkles", label: "Cuidados pessoais" },
  { value: "hand-coins", label: "Empréstimos" },
  { value: "shopping-basket", label: "Mercado" },
  { value: "paw-print", label: "Pets" },
  { value: "wrench", label: "Serviços" },
];

export function getColorLabel(value: string | null | undefined) {
  return COLOR_OPTIONS.find((option) => option.value === value)?.label ?? null;
}

export function getIconLabel(value: string | null | undefined) {
  return ICON_OPTIONS.find((option) => option.value === value)?.label ?? null;
}
