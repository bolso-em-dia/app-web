export type ColorOption = {
  value: string;
  label: string;
};

export type IconOption = {
  value: string;
  label: string;
  preview: string;
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
  { value: "shopping-cart", label: "Compras", preview: "🛒" },
  { value: "car", label: "Transporte", preview: "🚗" },
  { value: "home", label: "Casa", preview: "🏠" },
  { value: "heart", label: "Saúde", preview: "❤️" },
  { value: "briefcase", label: "Trabalho", preview: "💼" },
  { value: "credit-card", label: "Pagamento", preview: "💳" },
  { value: "plane", label: "Viagem", preview: "✈️" },
  { value: "gift", label: "Presentes", preview: "🎁" },
  { value: "book", label: "Educação", preview: "📚" },
  { value: "coffee", label: "Lazer", preview: "☕" },
  { value: "smartphone", label: "Tecnologia", preview: "📱" },
  { value: "gamepad", label: "Jogos", preview: "🎮" },
  { value: "shirt", label: "Roupas", preview: "👕" },
  { value: "school", label: "Escola", preview: "🏫" },
  { value: "dumbbell", label: "Fitness", preview: "🏋️" },
  { value: "pill", label: "Farmácia", preview: "💊" },
];

export function getIconPreview(value: string | null | undefined) {
  return ICON_OPTIONS.find((option) => option.value === value)?.preview ?? null;
}
