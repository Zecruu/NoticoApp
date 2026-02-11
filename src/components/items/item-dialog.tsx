"use client";

import { useState, useEffect } from "react";
import { type LocalItem, type ItemType } from "@/lib/db/indexed-db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Link2, Bell, X } from "lucide-react";

interface ItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: Omit<LocalItem, "id" | "clientId" | "createdAt" | "updatedAt" | "deleted">) => void;
  onUpdate?: (clientId: string, updates: Partial<LocalItem>) => void;
  editingItem?: LocalItem | null;
}

export function ItemDialog({ open, onClose, onSave, onUpdate, editingItem }: ItemDialogProps) {
  const [type, setType] = useState<ItemType>("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type);
      setTitle(editingItem.title);
      setContent(editingItem.content);
      setUrl(editingItem.url || "");
      setReminderDate(
        editingItem.reminderDate
          ? new Date(editingItem.reminderDate).toISOString().slice(0, 16)
          : ""
      );
      setTags(editingItem.tags);
      setPinned(editingItem.pinned);
    } else {
      setType("note");
      setTitle("");
      setContent("");
      setUrl("");
      setReminderDate("");
      setTags([]);
      setPinned(false);
    }
  }, [editingItem, open]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const itemData = {
      type,
      title: title.trim(),
      content: content.trim(),
      url: type === "url" ? url.trim() : undefined,
      reminderDate: type === "reminder" && reminderDate ? reminderDate : undefined,
      reminderCompleted: editingItem?.reminderCompleted || false,
      tags,
      pinned,
      color: editingItem?.color,
    };

    if (editingItem && onUpdate) {
      onUpdate(editingItem.clientId, itemData);
    } else {
      onSave(itemData);
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Edit Item" : "New Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!editingItem && (
            <Tabs value={type} onValueChange={(v) => setType(v as ItemType)}>
              <TabsList className="w-full">
                <TabsTrigger value="note" className="flex-1 gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Note
                </TabsTrigger>
                <TabsTrigger value="url" className="flex-1 gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="reminder" className="flex-1 gap-1.5">
                  <Bell className="h-3.5 w-3.5" />
                  Reminder
                </TabsTrigger>
              </TabsList>

              {/* Hidden tab contents just to satisfy Tabs component */}
              <TabsContent value="note" className="hidden" />
              <TabsContent value="url" className="hidden" />
              <TabsContent value="reminder" className="hidden" />
            </Tabs>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder={
                type === "note"
                  ? "Note title..."
                  : type === "url"
                    ? "Bookmark name..."
                    : "Reminder title..."
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {type === "url" && (
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          )}

          {type === "reminder" && (
            <div className="space-y-2">
              <Label htmlFor="reminderDate">Date & Time</Label>
              <Input
                id="reminderDate"
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">
              {type === "note" ? "Content" : "Description (optional)"}
            </Label>
            <Textarea
              id="content"
              placeholder={
                type === "note"
                  ? "Write your note..."
                  : "Add a description..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={type === "note" ? 6 : 3}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim()}>
              {editingItem ? "Save Changes" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
