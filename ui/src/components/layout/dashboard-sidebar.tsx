"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, PackageCheck } from "lucide-react";
import { siteConfig } from "@/config/site";
import { dashboardNav } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuthStore } from "@/features/auth/store";
import { useSidebarStore } from "@/components/layout/sidebar-store";

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const userRole = useAuthStore((state) => state.user?.role);
  const visibleItems = dashboardNav.filter(
    (item) =>
      !item.roles || (!!userRole && item.roles.includes(userRole as never)),
  );

  return (
    <nav
      aria-label="Main navigation"
      className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
    >
      {!collapsed && (
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">
          Workspace
        </p>
      )}
      {visibleItems.map((item) => {
        const active =
          item.match === "prefix"
            ? pathname === item.href || pathname.startsWith(`${item.href}/`)
            : pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.title}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.title : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {active && !collapsed && (
              <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />
            )}
            <Icon
              className={cn("size-[18px] shrink-0", active && "text-primary")}
            />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const user = useAuthStore((state) => state.user);
  const name = user?.name ?? "Account";

  return (
    <div className="border-t p-3">
      <div
        className={cn(
          "flex min-w-0 items-center gap-3 rounded-xl bg-muted/70 p-2.5",
          collapsed && "justify-center px-1",
        )}
      >
        <Avatar className="size-9 shrink-0 ring-2 ring-background">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {user?.name ? initials(user.name) : "SS"}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {name}
            </p>
            <p className="mt-0.5 truncate text-[11px] capitalize text-muted-foreground">
              {user?.role?.toLowerCase() ?? "Team member"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
      <SidebarFooter collapsed={collapsed} />
    </div>
  );
}

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-[72px] items-center gap-3 border-b px-5",
        collapsed && "justify-center px-2",
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
        <PackageCheck className="size-[19px]" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight">
            {siteConfig.name}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
            Inventory workspace
          </p>
        </div>
      )}
    </div>
  );
}

export function DashboardSidebar() {
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggle = useSidebarStore((state) => state.toggle);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-[76px]" : "w-[264px]",
      )}
    >
      <Brand collapsed={collapsed} />
      <SidebarContent collapsed={collapsed} />
      <button
        type="button"
        onClick={toggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[84px] flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        {collapsed ? (
          <ChevronRight className="size-3.5" />
        ) : (
          <ChevronLeft className="size-3.5" />
        )}
      </button>
    </aside>
  );
}

export function MobileSidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0">
        <Brand />
        <SidebarContent
          collapsed={false}
          onNavigate={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
