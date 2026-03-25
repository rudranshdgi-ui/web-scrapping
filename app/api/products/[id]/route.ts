import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Brand, SavedProduct } from "@/types";

// GET /api/products/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { success: false, error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  try {
    const rows = await query<{
      id: string; job_id: string; sku: string; brand: string; title: string;
      price: string | null; description: string | null;
      specifications: Record<string, string> | null;
      image_url: string | null; product_url: string | null;
      availability: string | null; rating: string | null; scraped_at: string;
    }>(
      `SELECT id, job_id, sku, brand, title, price, description, specifications,
              image_url, product_url, availability, rating, scraped_at
       FROM products WHERE id = $1`,
      [id]
    );

    if (!rows.length) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const r = rows[0];
    const product: SavedProduct = {
      id: r.id,
      jobId: r.job_id,
      sku: r.sku,
      brand: r.brand as Brand,
      title: r.title,
      price: r.price ?? undefined,
      description: r.description ?? undefined,
      specifications: r.specifications ?? undefined,
      imageUrl: r.image_url ?? undefined,
      productUrl: r.product_url ?? undefined,
      availability: r.availability ?? undefined,
      rating: r.rating ?? undefined,
      scrapedAt: r.scraped_at,
    };

    return NextResponse.json({ success: true, product });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
