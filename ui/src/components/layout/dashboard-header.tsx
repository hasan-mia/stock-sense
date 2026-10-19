"use client";

import { Menu, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function DashboardHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 md:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        )}
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary md:hidden">
          <PackageCheck className="size-[18px]" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">Stock Sense</p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Inventory management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
