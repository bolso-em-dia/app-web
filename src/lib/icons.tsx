import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  BookOpen,
  Briefcase,
  Car,
  Coffee,
  CreditCard,
  Dumbbell,
  Gamepad2,
  Gift,
  HeartPulse,
  House,
  Landmark,
  LayoutDashboard,
  Pill,
  Plane,
  ReceiptText,
  School,
  ShoppingCart,
  Shirt,
  Smartphone,
  Tag,
  Users,
  Wallet,
} from "lucide-react";

export type StoredIconId =
  | "shopping-cart"
  | "car"
  | "home"
  | "heart"
  | "briefcase"
  | "credit-card"
  | "plane"
  | "gift"
  | "book"
  | "coffee"
  | "smartphone"
  | "gamepad"
  | "shirt"
  | "school"
  | "dumbbell"
  | "pill";

export type NavigationIconId =
  | "dashboard"
  | "envelopes"
  | "fixed-expenses"
  | "transactions"
  | "family"
  | "categories"
  | "accounts";

export const storedIconMap: Record<StoredIconId, LucideIcon> = {
  "shopping-cart": ShoppingCart,
  car: Car,
  home: House,
  heart: HeartPulse,
  briefcase: Briefcase,
  "credit-card": CreditCard,
  plane: Plane,
  gift: Gift,
  book: BookOpen,
  coffee: Coffee,
  smartphone: Smartphone,
  gamepad: Gamepad2,
  shirt: Shirt,
  school: School,
  dumbbell: Dumbbell,
  pill: Pill,
};

export const navigationIconMap: Record<NavigationIconId, LucideIcon> = {
  dashboard: LayoutDashboard,
  envelopes: Wallet,
  "fixed-expenses": ReceiptText,
  transactions: ArrowRightLeft,
  family: Users,
  categories: Tag,
  accounts: Landmark,
};

export function getStoredIcon(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return storedIconMap[value as StoredIconId] ?? null;
}

export function getNavigationIcon(iconId: NavigationIconId) {
  return navigationIconMap[iconId];
}
