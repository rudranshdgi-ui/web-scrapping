/**
 * Scrape pipeline:
 *   1. Create job record (file store)
 *   2. Run brand scraper
 *   3. Enhance with AI agent (optional)
 *   4. Persist product to file store
 *   5. Mark job completed (or failed)
 */
import { v4 as uuidv4 } from "uuid";
import { getJob, saveJob, saveProduct, listProducts } from "./db";
import { scrapeProduct } from "./scraper";
import { extractProductData } from "./agent";
import { Brand, Job, SavedProduct } from "@/types";

export { getJob, listProducts } from "./db";

// ─── Job helpers ──────────────────────────────────────────────────────────────

export function createJob(sku: string, brand: Brand): string {
  const id = uuidv4();
  const job: Job = {
    id,
    status: "pending",
    sku,
    brand,
    createdAt: new Date().toISOString(),
  };
  saveJob(job);
  return id;
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export async function runPipeline(jobId: string, sku: string, brand: Brand): Promise<void> {
  // Mark running
  const job = getJob(jobId);
  if (job) saveJob({ ...job, status: "running" });

  try {
    const raw = await scrapeProduct({ sku, brand });
    const result = await extractProductData(raw);

    const product: SavedProduct = {
      id: uuidv4(),
      jobId,
      sku,
      brand,
      title: result.title,
      price: result.price,
      description: result.description,
      specifications: result.specifications,
      imageUrl: result.imageUrl,
      productUrl: result.productUrl,
      availability: result.availability,
      rating: result.rating,
      scrapedAt: new Date().toISOString(),
    };
    saveProduct(product);

    saveJob({
      ...getJob(jobId)!,
      status: "completed",
      completedAt: new Date().toISOString(),
      product: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    saveJob({
      ...getJob(jobId)!,
      status: "failed",
      error: message,
      completedAt: new Date().toISOString(),
    });
  }
}

