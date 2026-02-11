import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";

interface SyncOperation {
  action: "create" | "update" | "delete";
  clientId: string;
  data?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { operations, lastSyncAt } = await request.json() as {
      operations: SyncOperation[];
      lastSyncAt?: string;
    };

    const results: Record<string, unknown>[] = [];

    // Process each offline operation
    for (const op of operations) {
      try {
        if (op.action === "create") {
          const existing = await Item.findOne({ clientId: op.clientId });
          if (existing) {
            results.push({ clientId: op.clientId, status: "exists", item: existing });
          } else {
            const item = await Item.create({ ...op.data, clientId: op.clientId });
            results.push({ clientId: op.clientId, status: "created", item });
          }
        } else if (op.action === "update") {
          const item = await Item.findOneAndUpdate(
            { clientId: op.clientId },
            op.data,
            { new: true, runValidators: true }
          );
          results.push({ clientId: op.clientId, status: item ? "updated" : "not_found", item });
        } else if (op.action === "delete") {
          const item = await Item.findOneAndUpdate(
            { clientId: op.clientId },
            { deleted: true },
            { new: true }
          );
          results.push({ clientId: op.clientId, status: item ? "deleted" : "not_found" });
        }
      } catch (opError) {
        console.error(`Sync operation failed for ${op.clientId}:`, opError);
        results.push({ clientId: op.clientId, status: "error", error: String(opError) });
      }
    }

    // Return all items updated since last sync for pull
    const query: Record<string, unknown> = {};
    if (lastSyncAt) {
      query.updatedAt = { $gte: new Date(lastSyncAt) };
    }
    const serverItems = await Item.find(query).lean();

    return NextResponse.json({
      results,
      serverItems,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/items/sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
