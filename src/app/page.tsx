"use client";

import { useState, useMemo, useCallback } from "react";
import { useItems } from "@/hooks/use-items";
import { useFolders } from "@/hooks/use-folders";
import { type LocalItem } from "@/lib/db/indexed-db";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ItemList } from "@/components/items/item-list";
import { ItemDialog } from "@/components/items/item-dialog";
import { SearchCommand } from "@/components/items/search-bar";
import { toast } from "sonner";

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LocalItem | null>(null);

  const { folders } = useFolders();
  const { items, loading, syncing, addItem, editItem, removeItem, togglePin, syncNow } =
    useItems(activeFilter, searchQuery, activeFolder);

  // Counts for sidebar (type-based, ignoring folder filter)
  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = { note: 0, url: 0, reminder: 0 };
    for (const item of items) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Counts per folder
  const folderItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      if (item.folderId) {
        counts[item.folderId] = (counts[item.folderId] || 0) + 1;
      }
    }
    return counts;
  }, [items]);

  const handleCreateNew = useCallback(() => {
    setEditingItem(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((item: LocalItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    async (item: Omit<LocalItem, "id" | "clientId" | "createdAt" | "updatedAt" | "deleted">) => {
      await addItem(item);
      toast.success("Item created");
    },
    [addItem]
  );

  const handleUpdate = useCallback(
    async (clientId: string, updates: Partial<LocalItem>) => {
      await editItem(clientId, updates);
      toast.success("Item updated");
    },
    [editItem]
  );

  const handleDelete = useCallback(
    async (clientId: string) => {
      await removeItem(clientId);
      toast.success("Item deleted");
    },
    [removeItem]
  );

  const handleTogglePin = useCallback(
    async (clientId: string, pinned: boolean) => {
      await togglePin(clientId, pinned);
      toast.success(pinned ? "Unpinned" : "Pinned");
    },
    [togglePin]
  );

  const handleToggleComplete = useCallback(
    async (clientId: string, completed: boolean) => {
      await editItem(clientId, { reminderCompleted: !completed });
      toast.success(!completed ? "Marked complete" : "Marked incomplete");
    },
    [editItem]
  );

  const handleSearchSelect = useCallback((item: LocalItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        syncing={syncing}
        onSync={syncNow}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeFilter={activeFilter}
          activeFolder={activeFolder}
          onFilterChange={setActiveFilter}
          onFolderChange={setActiveFolder}
          onCreateNew={handleCreateNew}
          itemCounts={itemCounts}
          folders={folders}
          folderItemCounts={folderItemCounts}
        />

        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <ItemList
            items={items}
            folders={folders}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTogglePin={handleTogglePin}
            onToggleComplete={handleToggleComplete}
            activeFilter={activeFilter}
            activeFolder={activeFolder}
          />
        </main>
      </div>

      <MobileNav
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onCreateNew={handleCreateNew}
      />

      <ItemDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        onUpdate={handleUpdate}
        editingItem={editingItem}
        folders={folders}
        defaultFolderId={activeFolder}
      />

      <SearchCommand onSelect={handleSearchSelect} />
    </div>
  );
}
