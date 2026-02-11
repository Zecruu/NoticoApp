import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const since = searchParams.get("since");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { deleted: { $ne: true } };

    if (type && type !== "all") {
      query.type = type;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (since) {
      query.updatedAt = { $gte: new Date(since) };
    }

    const items = await Item.find(query).sort({ pinned: -1, updatedAt: -1 }).lean();

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/items error:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Idempotent create via clientId
    const existing = await Item.findOne({ clientId: body.clientId });
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const item = await Item.create(body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/items error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
