import { NextRequest, NextResponse } from "next/server";
import { scrapeProduct } from "@/lib/scraper";
import { BulkScrapeRequest, BulkScrapeResponse, ScrapeResponse } from "@/types";

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

    const results: ScrapeResponse[] = await Promise.all(
      body.queries.map(async (query) => {
        if (!query.sku || !query.brand) {
          return {
            success: false,
            error: "sku and brand are required for each query",
          };
        }

        const data = await scrapeProduct(query);
        return {
          success: !data.error,
          data,
          error: data.error,
        };
      })
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    const response: BulkScrapeResponse = {
      success: true,
      results,
      total: results.length,
      successful,
      failed,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

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

  const data = await scrapeProduct({ sku, brand: brand as never });
  return NextResponse.json({
    success: !data.error,
    data,
    error: data.error,
  });
}
