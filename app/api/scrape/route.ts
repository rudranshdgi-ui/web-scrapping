import { NextRequest, NextResponse } from "next/server";
import { scrapeProduct } from "@/lib/scraper";
import { createJob, runPipeline } from "@/lib/pipeline";
import { BulkScrapeRequest, BulkScrapeResponse, ScrapeResponse, Brand } from "@/types";

// ── POST /api/scrape ──────────────────────────────────────────────────────────
// Accepts { queries: [{ sku, brand }] }.
// If DATABASE_URL is configured → creates async jobs, returns { jobIds }.
// Otherwise → runs scrapers synchronously, returns results immediately.
export async function POST(request: NextRequest) {
  try {
    const body: BulkScrapeRequest = await request.json();

    if (!body.queries || !Array.isArray(body.queries) || body.queries.length === 0) {
      return NextResponse.json(
        { success: false, error: "queries array is required" },
        { status: 400 }
      );
    }
    if (body.queries.length > 20) {
      return NextResponse.json(
        { success: false, error: "Maximum 20 queries allowed per request" },
        { status: 400 }
      );
    }

    // Async pipeline mode (requires DATABASE_URL)
    if (process.env.DATABASE_URL) {
      const jobIds: string[] = [];
      for (const q of body.queries) {
        if (!q.sku || !q.brand) continue;
        const jobId = await createJob(q.sku, q.brand as Brand);
        // Fire-and-forget — response is immediate
        runPipeline(jobId, q.sku, q.brand as Brand).catch(console.error);
        jobIds.push(jobId);
      }
      return NextResponse.json({ success: true, async: true, jobIds });
    }

    // Synchronous fallback (no database configured)
    const results: ScrapeResponse[] = await Promise.all(
      body.queries.map(async (q) => {
        if (!q.sku || !q.brand) {
          return { success: false, error: "sku and brand are required for each query" };
        }
        const data = await scrapeProduct(q);
        return { success: !data.error, data, error: data.error };
      })
    );

    const successful = results.filter((r) => r.success).length;
    const response: BulkScrapeResponse = {
      success: true,
      results,
      total: results.length,
      successful,
      failed: results.length - successful,
    };
    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ── GET /api/scrape?sku=...&brand=... ─────────────────────────────────────────
// Synchronous single-product scrape (no DB required).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get("sku");
  const brand = searchParams.get("brand");

  if (!sku || !brand) {
    return NextResponse.json(
      { success: false, error: "sku and brand query params are required" },
      { status: 400 }
    );
  }

  const validBrands = ["samsung", "lg", "sony", "motorola", "micromax"];
  if (!validBrands.includes(brand)) {
    return NextResponse.json(
      { success: false, error: `Invalid brand. Supported: ${validBrands.join(", ")}` },
      { status: 400 }
    );
  }

  const data = await scrapeProduct({ sku, brand: brand as Brand });
  return NextResponse.json({ success: !data.error, data, error: data.error });
}
