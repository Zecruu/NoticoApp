import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Folder from "@/models/Folder";
import Item from "@/models/Item";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const folder = await Folder.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error("PUT /api/folders/[id] error:", error);
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const folder = await Folder.findById(id);
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Cascade: soft-delete all items in this folder
    await Item.updateMany(
      { folderId: folder.clientId, deleted: { $ne: true } },
      { deleted: true }
    );

    // Soft-delete the folder
    folder.deleted = true;
    await folder.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/folders/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
