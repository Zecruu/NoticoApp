"use client";

import { useState, useEffect, useCallback } from "react";
import { type LocalItem } from "@/lib/db/indexed-db";
import {
  createItem,
  updateItem,
  deleteItem,
  getItems,
  initialSync,
  setupSyncListeners,
  performSync,
} from "@/lib/sync/sync-engine";

export function useItems(typeFilter?: string, searchQuery?: string) {
  const [items, setItems] = useState<LocalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const result = await getItems(typeFilter, searchQuery);
    setItems(result);
    setLoading(false);
  }, [typeFilter, searchQuery]);

  // Initial load + sync
  useEffect(() => {
    let mounted = true;

    async function init() {
      // Load from IndexedDB first (instant)
      await refresh();

      // Then sync with server
      if (mounted) {
        setSyncing(true);
        await initialSync();
        await refresh();
        setSyncing(false);
      }
    }

    setupSyncListeners();
    init();

    return () => {
      mounted = false;
    };
  }, [refresh]);

  const addItem = useCallback(
    async (item: Omit<LocalItem, "id" | "clientId" | "createdAt" | "updatedAt" | "deleted">) => {
      await createItem(item);
      await refresh();
    },
    [refresh]
  );

  const editItem = useCallback(
    async (clientId: string, updates: Partial<LocalItem>) => {
      await updateItem(clientId, updates);
      await refresh();
    },
    [refresh]
  );

  const removeItem = useCallback(
    async (clientId: string) => {
      await deleteItem(clientId);
      await refresh();
    },
    [refresh]
  );

  const togglePin = useCallback(
    async (clientId: string, currentPinned: boolean) => {
      await updateItem(clientId, { pinned: !currentPinned });
      await refresh();
    },
    [refresh]
  );

  const syncNow = useCallback(async () => {
    setSyncing(true);
    await performSync();
    await refresh();
    setSyncing(false);
  }, [refresh]);

  return {
    items,
    loading,
    syncing,
    addItem,
    editItem,
    removeItem,
    togglePin,
    syncNow,
    refresh,
  };
}
