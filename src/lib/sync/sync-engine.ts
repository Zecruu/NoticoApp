import db, { type LocalItem, type SyncQueueEntry } from "@/lib/db/indexed-db";
import { v4 as uuidv4 } from "uuid";

const SYNC_KEY = "notico_last_sync";

function getLastSync(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SYNC_KEY);
}

function setLastSync(timestamp: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SYNC_KEY, timestamp);
  }
}

// Create an item locally and queue for sync
export async function createItem(
  item: Omit<LocalItem, "id" | "clientId" | "createdAt" | "updatedAt" | "deleted">
): Promise<LocalItem> {
  const now = new Date().toISOString();
  const clientId = uuidv4();

  const localItem: LocalItem = {
    ...item,
    clientId,
    deleted: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.items.add(localItem);

  // Queue sync operation
  await db.syncQueue.add({
    action: "create",
    clientId,
    data: localItem as unknown as Record<string, unknown>,
    timestamp: now,
  });

  triggerSync();

  return localItem;
}

// Update an item locally and queue for sync
export async function updateItem(
  clientId: string,
  updates: Partial<LocalItem>
): Promise<LocalItem | undefined> {
  const now = new Date().toISOString();
  const item = await db.items.where("clientId").equals(clientId).first();
  if (!item) return undefined;

  const updatedData = { ...updates, updatedAt: now };
  await db.items.where("clientId").equals(clientId).modify((item) => {
    Object.assign(item, updatedData);
  });

  await db.syncQueue.add({
    action: "update",
    clientId,
    data: updatedData as unknown as Record<string, unknown>,
    timestamp: now,
  });

  triggerSync();

  return { ...item, ...updatedData };
}

// Soft-delete an item locally and queue for sync
export async function deleteItem(clientId: string): Promise<void> {
  const now = new Date().toISOString();

  await db.items.where("clientId").equals(clientId).modify((item) => {
    item.deleted = true;
    item.updatedAt = now;
  });

  await db.syncQueue.add({
    action: "delete",
    clientId,
    timestamp: now,
  });

  triggerSync();
}

// Get all non-deleted items, optionally filtered
export async function getItems(
  type?: string,
  searchQuery?: string
): Promise<LocalItem[]> {
  let items: LocalItem[];

  if (type && type !== "all") {
    items = await db.items.where("type").equals(type).toArray();
  } else {
    items = await db.items.toArray();
  }

  // Filter out deleted items
  items = items.filter((item) => !item.deleted);

  // Client-side search
  if (searchQuery) {
    const terms = searchQuery.toLowerCase().split(/\s+/);
    items = items.filter((item) => {
      const searchable = `${item.title} ${item.content} ${item.tags.join(" ")} ${item.url || ""}`.toLowerCase();
      return terms.every((term) => searchable.includes(term));
    });
  }

  // Sort: pinned first, then by updatedAt descending
  items.sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return items;
}

// Sync pending operations with server
let syncInProgress = false;

export async function performSync(): Promise<boolean> {
  if (syncInProgress || !navigator.onLine) return false;

  syncInProgress = true;

  try {
    // Get all queued operations
    const queue = await db.syncQueue.orderBy("timestamp").toArray();

    // Deduplicate: keep only latest operation per clientId
    const operationMap = new Map<string, SyncQueueEntry>();
    for (const entry of queue) {
      operationMap.set(entry.clientId, entry);
    }

    const operations = Array.from(operationMap.values()).map((entry) => ({
      action: entry.action,
      clientId: entry.clientId,
      data: entry.data,
    }));

    const lastSyncAt = getLastSync();

    const response = await fetch("/api/items/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operations, lastSyncAt }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    const { serverItems, syncedAt } = await response.json();

    // Clear the sync queue
    await db.syncQueue.clear();

    // Merge server items into local DB
    for (const serverItem of serverItems) {
      const localItem = await db.items
        .where("clientId")
        .equals(serverItem.clientId)
        .first();

      const mapped: LocalItem = {
        clientId: serverItem.clientId,
        serverId: serverItem._id,
        type: serverItem.type,
        title: serverItem.title,
        content: serverItem.content || "",
        url: serverItem.url,
        reminderDate: serverItem.reminderDate,
        reminderCompleted: serverItem.reminderCompleted,
        tags: serverItem.tags || [],
        pinned: serverItem.pinned || false,
        color: serverItem.color,
        deleted: serverItem.deleted || false,
        createdAt: serverItem.createdAt,
        updatedAt: serverItem.updatedAt,
      };

      if (localItem) {
        // Update existing local item with server data
        await db.items.where("clientId").equals(serverItem.clientId).modify((item) => { Object.assign(item, mapped); });
      } else {
        // Add new item from server
        await db.items.add(mapped);
      }
    }

    setLastSync(syncedAt);
    return true;
  } catch (error) {
    console.error("Sync error:", error);
    return false;
  } finally {
    syncInProgress = false;
  }
}

// Debounced sync trigger
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function triggerSync() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    performSync();
  }, 1000);
}

// Initial sync: pull all server data into IndexedDB
export async function initialSync(): Promise<void> {
  if (!navigator.onLine) return;

  try {
    const response = await fetch("/api/items");
    if (!response.ok) return;

    const serverItems = await response.json();

    for (const serverItem of serverItems) {
      const localItem = await db.items
        .where("clientId")
        .equals(serverItem.clientId)
        .first();

      const mapped: LocalItem = {
        clientId: serverItem.clientId,
        serverId: serverItem._id,
        type: serverItem.type,
        title: serverItem.title,
        content: serverItem.content || "",
        url: serverItem.url,
        reminderDate: serverItem.reminderDate,
        reminderCompleted: serverItem.reminderCompleted,
        tags: serverItem.tags || [],
        pinned: serverItem.pinned || false,
        color: serverItem.color,
        deleted: serverItem.deleted || false,
        createdAt: serverItem.createdAt,
        updatedAt: serverItem.updatedAt,
      };

      if (!localItem) {
        await db.items.add(mapped);
      } else {
        // Server is source of truth if no pending changes
        const hasPending = await db.syncQueue
          .where("clientId")
          .equals(serverItem.clientId)
          .count();

        if (hasPending === 0) {
          await db.items.where("clientId").equals(serverItem.clientId).modify((item) => { Object.assign(item, mapped); });
        }
      }
    }

    setLastSync(new Date().toISOString());
  } catch (error) {
    console.error("Initial sync error:", error);
  }
}

// Setup online/offline listeners
export function setupSyncListeners() {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    performSync();
  });
}
