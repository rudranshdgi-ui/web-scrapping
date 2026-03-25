/**
 * Scrape pipeline:
 *   1. Create job record
 *   2. Run brand scraper
 *   3. Enhance with AI agent
 *   4. Persist product to DB
 *   5. Mark job completed (or failed)
 */
import { v4 as uuidv4 } from "uuid";
import { query } from "./db";
import { scrapeProduct } from "./scraper";
import { extractProductData } from "./agent";
import { Brand, Job, JobStatus, SavedProduct } from "@/types";

// ─── Job helpers ─────────────────────────────────────────────────────────────

export async function createJob(sku: string, brand: Brand): Promise<string> {
  const id = uuidv4();
  await query(
    `INSERT INTO scrape_jobs (id, sku, brand, status) VALUES ($1, $2, $3, 'pending')`,
    [id, sku, brand]
  );
  return id;
}

export async function getJob(jobId: string): Promise<Job | null> {
  const rows = await query<{
    id: string; status: string; sku: string; brand: string;
    error: string | null; created_at: string; completed_at: string | null;
  }>(
    `SELECT j.id, j.status, j.sku, j.brand, j.error, j.created_at, j.completed_at
     FROM scrape_jobs j WHERE j.id = $1`,
    [jobId]
  );
  if (!rows.length) return null;

  const row = rows[0];
  let product: Job["product"] | undefined;

  if (row.status === "completed") {
    const products = await query<{
      sku: string; brand: string; title: string; price: string | null;
      description: string | null; specifications: Record<string,string> | null;
      image_url: string | null; product_url: string | null;
      availability: string | null; rating: string | null;
    }>(
      `SELECT sku, brand, title, price, description, specifications,
              image_url, product_url, availability, rating
       FROM products WHERE job_id = $1 LIMIT 1`,
      [jobId]
    );
    if (products.length) {
      const p = products[0];
      product = {
        sku: p.sku,
        brand: p.brand as Brand,
        title: p.title,
        price: p.price ?? undefined,
        description: p.description ?? undefined,
        specifications: p.specifications ?? undefined,
        imageUrl: p.image_url ?? undefined,
        productUrl: p.product_url ?? undefined,
        availability: p.availability ?? undefined,
        rating: p.rating ?? undefined,
      };
    }
  }

  return {
    id: row.id,
    status: row.status as JobStatus,
    sku: row.sku,
    brand: row.brand as Brand,
    error: row.error ?? undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    product,
  };
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export async function runPipeline(jobId: string, sku: string, brand: Brand): Promise<void> {
  await query(`UPDATE scrape_jobs SET status = 'running' WHERE id = $1`, [jobId]);

  try {
    const raw = await scrapeProduct({ sku, brand });
    const result = await extractProductData(raw);

    const productId = uuidv4();
    await query(
      `INSERT INTO products
         (id, job_id, sku, brand, title, price, description, specifications,
          image_url, product_url, availability, rating)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        productId, jobId, sku, brand,
        result.title,
        result.price ?? null,
        result.description ?? null,
        JSON.stringify(result.specifications ?? {}),
        result.imageUrl ?? null,
        result.productUrl ?? null,
        result.availability ?? null,
        result.rating ?? null,
      ]
    );

    await query(
      `UPDATE scrape_jobs SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [jobId]
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await query(
      `UPDATE scrape_jobs SET status = 'failed', error = $2, completed_at = NOW() WHERE id = $1`,
      [jobId, message]
    );
  }
}

// ─── Saved products list ──────────────────────────────────────────────────────

export async function listProducts(
  limit = 50,
  offset = 0
): Promise<{ products: SavedProduct[]; total: number }> {
  const [countRow] = await query<{ count: string }>(`SELECT COUNT(*) AS count FROM products`);
  const total = parseInt(countRow?.count ?? "0", 10);

  const rows = await query<{
    id: string; job_id: string; sku: string; brand: string; title: string;
    price: string | null; description: string | null;
    specifications: Record<string,string> | null;
    image_url: string | null; product_url: string | null;
    availability: string | null; rating: string | null; scraped_at: string;
  }>(
    `SELECT id, job_id, sku, brand, title, price, description, specifications,
            image_url, product_url, availability, rating, scraped_at
     FROM products ORDER BY scraped_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const products: SavedProduct[] = rows.map((r) => ({
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
  }));

  return { products, total };
}
