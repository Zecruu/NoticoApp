"use client";

import { cn } from "@/lib/utils";
import { type LocalFolder } from "@/lib/db/indexed-db";
import {
  FileText,
  Link2,
  Bell,
  LayoutDashboard,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const navItems = [
  { label: "All Items", value: "all", icon: LayoutDashboard },
  { label: "Notes", value: "note", icon: FileText },
  { label: "URLs", value: "url", icon: Link2 },
  { label: "Reminders", value: "reminder", icon: Bell },
];

interface SidebarProps {
  activeFilter: string;
  activeFolder: string | null;
  onFilterChange: (filter: string) => void;
  onFolderChange: (folderId: string | null) => void;
  onCreateNew: () => void;
  itemCounts: Record<string, number>;
  folders: LocalFolder[];
  folderItemCounts: Record<string, number>;
}

export function Sidebar({
  activeFilter,
  activeFolder,
  onFilterChange,
  onFolderChange,
  onCreateNew,
  itemCounts,
  folders,
  folderItemCounts,
}: SidebarProps) {
  return (
    <aside className="hidden md:flex w-56 flex-col border-r bg-muted/30">
      <div className="flex-1 overflow-auto p-4">
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
                onClick={() => {
                  onFolderChange(null);
                  onFilterChange(item.value);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  !activeFolder && activeFilter === item.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    !activeFolder && activeFilter === item.value
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

        {folders.length > 0 && (
          <>
            <Separator className="my-4" />
            <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Folders
            </p>
            <nav className="space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.clientId}
                  onClick={() => {
                    onFolderChange(folder.clientId);
                    onFilterChange("all");
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    activeFolder === folder.clientId
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: folder.color || "#6b7280" }}
                  />
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      activeFolder === folder.clientId
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {folderItemCounts[folder.clientId] || 0}
                  </span>
                </button>
              ))}
            </nav>
          </>
        )}
      </div>

      <div className="border-t p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
