/**
 * File-based store — replaces PostgreSQL.
 * Data is written to:
 *   - dev:  <project-root>/data/
 *   - prod: /tmp/pdp-scraper/  (Vercel / any serverless host)
 *
 * Override the directory with the DATA_DIR env var.
 */
import fs from "fs";
import path from "path";
import { Job, SavedProduct } from "@/types";

const DATA_DIR =
  process.env.DATA_DIR ??
  (process.env.NODE_ENV === "production"
    ? "/tmp/pdp-scraper"
    : path.join(process.cwd(), "data"));

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(filename: string, fallback: T): T {
  const file = path.join(DATA_DIR, filename);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filename: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

function readJobs(): Record<string, Job> {
  return readJson("jobs.json", {});
}

export function getJob(id: string): Job | null {
  return readJobs()[id] ?? null;
}

export function saveJob(job: Job) {
  const jobs = readJobs();
  jobs[job.id] = job;
  writeJson("jobs.json", jobs);
}

// ── Products ──────────────────────────────────────────────────────────────────

function readProducts(): SavedProduct[] {
  return readJson("products.json", []);
}

export function getProduct(id: string): SavedProduct | null {
  return readProducts().find((p) => p.id === id) ?? null;
}

export function saveProduct(product: SavedProduct) {
  const products = readProducts();
  // Deduplicate by id
  const filtered = products.filter((p) => p.id !== product.id);
  writeJson("products.json", [product, ...filtered]);
}

export function listProducts(
  limit = 50,
  offset = 0
): { products: SavedProduct[]; total: number } {
  const all = readProducts();
  return { products: all.slice(offset, offset + limit), total: all.length };
}
