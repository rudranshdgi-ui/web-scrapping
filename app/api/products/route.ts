import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/db";

// GET /api/products?limit=50&offset=0
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  try {
    const { products, total } = listProducts(limit, offset);
    return NextResponse.json({ success: true, products, total });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
