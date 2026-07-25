import type { LucideIcon } from "lucide-react";
import { createElement } from "react";
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
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  LayoutDashboard,
  PawPrint,
  Pill,
  Plane,
  ReceiptText,
  School,
  ShoppingBasket,
  ShoppingCart,
  Shirt,
  Smartphone,
  Sparkles,
  Tag,
  Users,
  Wallet,
  Wrench,
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
  | "pill"
  | "sparkles"
  | "hand-coins"
  | "shopping-basket"
  | "paw-print"
  | "wrench";

export type NavigationIconId = "dashboard" | "budgets" | "fixed-expenses" | "transactions" | "family" | "categories" | "accounts";

const storedIconMap: Record<StoredIconId, LucideIcon> = {
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
  sparkles: Sparkles,
  "hand-coins": HandCoins,
  "shopping-basket": ShoppingBasket,
  "paw-print": PawPrint,
  wrench: Wrench,
};

const navigationIconMap: Record<NavigationIconId, LucideIcon> = {
  dashboard: LayoutDashboard,
  budgets: Wallet,
  "fixed-expenses": ReceiptText,
  transactions: ArrowRightLeft,
  family: Users,
  categories: Tag,
  accounts: Landmark,
};

export function getNavigationIcon(iconId: NavigationIconId) {
  return navigationIconMap[iconId];
}

export function renderStoredIcon(name: string | null | undefined, className?: string) {
  const icon = name ? storedIconMap[name as StoredIconId] : null;
  if (!icon) return null;
  return createElement(icon, className ? { className } : undefined);
}
