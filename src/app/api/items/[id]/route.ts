import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const item = await Item.findById(id).lean();

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("GET /api/items/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const item = await Item.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("PUT /api/items/[id] error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Soft delete
    const item = await Item.findByIdAndUpdate(
      id,
      { deleted: true },
      { new: true }
    ).lean();

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/items/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
