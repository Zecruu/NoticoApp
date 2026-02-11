"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SyncStatus } from "@/components/sync-status";
import { useEffect, useState } from "react";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  syncing: boolean;
  onSync: () => void;
}

export function Header({ searchQuery, onSearchChange, syncing, onSync }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-primary">Notico</span>
        </h1>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes, URLs, reminders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <SyncStatus syncing={syncing} onSync={onSync} />
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
