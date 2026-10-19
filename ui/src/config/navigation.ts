import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ShoppingCart,
  History,
  ChartNoAxesCombined,
  Users,
} from "lucide-react";
import type { Role } from "@/features/auth/types";

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  match?: "exact" | "prefix";
  roles?: Role[];
};

export const dashboardNav: NavigationItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  {
    title: "Products",
    href: "/dashboard/products",
    icon: Package,
    match: "prefix",
  },
  {
    title: "Categories",
    href: "/dashboard/categories",
    icon: Tags,
    match: "prefix",
  },
  {
    title: "Suppliers",
    href: "/dashboard/suppliers",
    icon: Truck,
    match: "prefix",
  },
  {
    title: "Sales",
    href: "/dashboard/sales",
    icon: ShoppingCart,
    match: "prefix",
  },
  {
    title: "Stock movements",
    href: "/dashboard/stock-movements",
    icon: History,
    match: "prefix",
  },
  {
    title: "Forecast",
    href: "/dashboard/forecast",
    icon: ChartNoAxesCombined,
    match: "prefix",
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
    match: "prefix",
    roles: ["admin"],
  },
];
