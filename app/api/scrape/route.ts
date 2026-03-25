import { NextRequest, NextResponse } from "next/server";
import { scrapeProduct } from "@/lib/scraper";
import { createJob, runPipeline } from "@/lib/pipeline";
import { BulkScrapeRequest, Brand } from "@/types";

// POST /api/scrape  { queries: [{ sku, brand }] }
// Creates async jobs (file-based), returns { jobIds } immediately.
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

    const jobIds: string[] = [];
    for (const q of body.queries) {
      if (!q.sku || !q.brand) continue;
      const jobId = createJob(q.sku, q.brand as Brand);
      runPipeline(jobId, q.sku, q.brand as Brand).catch(console.error);
      jobIds.push(jobId);
    }

    return NextResponse.json({ success: true, async: true, jobIds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET /api/scrape?sku=...&brand=...
// Synchronous scrape — no persistence, instant result.
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
