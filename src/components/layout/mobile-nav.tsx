"use client";

import { cn } from "@/lib/utils";
import {
  FileText,
  Link2,
  Plus,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import Link from "next/link";

const navItems = [
  { label: "All", value: "all", icon: LayoutDashboard },
  { label: "Notes", value: "note", icon: FileText },
  { label: "New", value: "new", icon: Plus },
  { label: "URLs", value: "url", icon: Link2 },
  { label: "Settings", value: "settings", icon: Settings },
];

interface MobileNavProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onCreateNew: () => void;
}

export function MobileNav({ activeFilter, onFilterChange, onCreateNew }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isNew = item.value === "new";
        const isSettings = item.value === "settings";

        if (isSettings) {
          return (
            <Link
              key={item.value}
              href="/settings"
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full">
                <Icon className="h-4 w-4" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        }

        return (
          <button
            key={item.value}
            onClick={() => (isNew ? onCreateNew() : onFilterChange(item.value))}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
              isNew
                ? "text-primary"
                : activeFilter === item.value
                  ? "text-primary"
                  : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                isNew && "bg-primary text-primary-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
