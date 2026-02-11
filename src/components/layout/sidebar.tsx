"use client";

import { cn } from "@/lib/utils";
import {
  FileText,
  Link2,
  Bell,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "All Items", value: "all", icon: LayoutDashboard },
  { label: "Notes", value: "note", icon: FileText },
  { label: "URLs", value: "url", icon: Link2 },
  { label: "Reminders", value: "reminder", icon: Bell },
];

interface SidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onCreateNew: () => void;
  itemCounts: Record<string, number>;
}

export function Sidebar({
  activeFilter,
  onFilterChange,
  onCreateNew,
  itemCounts,
}: SidebarProps) {
  return (
    <aside className="hidden md:flex w-56 flex-col border-r bg-muted/30 p-4">
      <Button onClick={onCreateNew} className="mb-6 w-full gap-2">
        <Plus className="h-4 w-4" />
        New Item
      </Button>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const count =
            item.value === "all"
              ? Object.values(itemCounts).reduce((a, b) => a + b, 0)
              : itemCounts[item.value] || 0;

          return (
            <button
              key={item.value}
              onClick={() => onFilterChange(item.value)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                activeFilter === item.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  activeFilter === item.value
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
