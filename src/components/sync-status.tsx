"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatusProps {
  syncing: boolean;
  onSync: () => void;
}

export function SyncStatus({ syncing, onSync }: SyncStatusProps) {
  const isOnline = useOnlineStatus();

  return (
    <button
      onClick={onSync}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        isOnline
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      )}
    >
      {syncing ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : isOnline ? (
        <Wifi className="h-3 w-3" />
      ) : (
        <WifiOff className="h-3 w-3" />
      )}
      {syncing ? "Syncing..." : isOnline ? "Online" : "Offline"}
    </button>
  );
}
