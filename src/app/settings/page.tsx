"use client";

import { useState } from "react";
import { useFolders } from "@/hooks/use-folders";
import { type LocalFolder } from "@/lib/db/indexed-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280", "#78716c",
];

export default function SettingsPage() {
  const { folders, addFolder, editFolder, removeFolder } = useFolders();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[5]);

  const [editingFolder, setEditingFolder] = useState<LocalFolder | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<LocalFolder | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await addFolder({ name: newName.trim(), color: newColor });
    setNewName("");
    setNewColor(PRESET_COLORS[5]);
    setShowNewForm(false);
    toast.success("Folder created");
  };

  const handleEdit = async () => {
    if (!editingFolder || !editName.trim()) return;
    await editFolder(editingFolder.clientId, { name: editName.trim(), color: editColor });
    setEditingFolder(null);
    toast.success("Folder updated");
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await removeFolder(deleteConfirm.clientId);
    setDeleteConfirm(null);
    toast.success("Folder and all its items deleted");
  };

  const startEdit = (folder: LocalFolder) => {
    setEditingFolder(folder);
    setEditName(folder.name);
    setEditColor(folder.color || "#6b7280");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Folders</CardTitle>
            <Button
              size="sm"
              onClick={() => setShowNewForm(true)}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              New Folder
            </Button>
          </CardHeader>
          <CardContent>
            {showNewForm && (
              <div className="mb-4 rounded-lg border p-4 space-y-3">
                <div className="space-y-2">
                  <Label>Folder Name</Label>
                  <Input
                    placeholder="e.g., Work Project"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                    }}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewColor(color)}
                        className="h-7 w-7 rounded-md border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: newColor === color ? "white" : "transparent",
                          boxShadow: newColor === color ? `0 0 0 2px ${color}` : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowNewForm(false);
                      setNewName("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            )}

            {folders.length === 0 && !showNewForm ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <FolderOpen className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">No folders yet. Create one to organize your items.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {folders.map((folder) => (
                  <div
                    key={folder.clientId}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors"
                  >
                    <div
                      className="h-4 w-4 rounded-sm shrink-0"
                      style={{ backgroundColor: folder.color || "#6b7280" }}
                    />
                    <span className="flex-1 text-sm font-medium">{folder.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEdit(folder)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(folder)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingFolder} onOpenChange={(open) => !open && setEditingFolder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEdit();
                }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditColor(color)}
                    className="h-7 w-7 rounded-md border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: editColor === color ? "white" : "transparent",
                      boxShadow: editColor === color ? `0 0 0 2px ${color}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingFolder(null)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={!editName.trim()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;? This will also permanently delete <strong>all notes, URLs, and reminders</strong> inside this folder. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Folder & Contents
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
