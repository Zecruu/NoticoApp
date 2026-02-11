"use client";

import { type LocalItem } from "@/lib/db/indexed-db";
import { ItemCard } from "./item-card";
import { FileText, Link2, Bell, Inbox } from "lucide-react";

interface ItemListProps {
  items: LocalItem[];
  loading: boolean;
  onEdit: (item: LocalItem) => void;
  onDelete: (clientId: string) => void;
  onTogglePin: (clientId: string, pinned: boolean) => void;
  onToggleComplete: (clientId: string, completed: boolean) => void;
  activeFilter: string;
}

const emptyMessages: Record<string, { icon: React.ElementType; message: string }> = {
  all: { icon: Inbox, message: "No items yet. Create your first note, bookmark, or reminder!" },
  note: { icon: FileText, message: "No notes yet. Start writing!" },
  url: { icon: Link2, message: "No bookmarks yet. Save your favorite URLs!" },
  reminder: { icon: Bell, message: "No reminders yet. Set one up!" },
};

export function ItemList({
  items,
  loading,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleComplete,
  activeFilter,
}: ItemListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 md:p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-36 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    const empty = emptyMessages[activeFilter] || emptyMessages.all;
    const Icon = empty.icon;

    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Icon className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-sm">{empty.message}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 md:p-6">
      {items.map((item) => (
        <ItemCard
          key={item.clientId}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
          onToggleComplete={onToggleComplete}
        />
      ))}
    </div>
  );
}
