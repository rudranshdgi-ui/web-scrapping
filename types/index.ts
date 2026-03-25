export type Brand = "samsung" | "lg" | "sony" | "motorola" | "micromax";

export interface ProductResult {
  sku: string;
  title: string;
  brand: Brand;
  price?: string;
  description?: string;
  specifications?: Record<string, string>;
  imageUrl?: string;
  productUrl?: string;
  availability?: string;
  rating?: string;
  error?: string;
}

export interface ScrapeRequest {
  sku: string;
  brand: Brand;
}

export interface ScrapeResponse {
  success: boolean;
  data?: ProductResult;
  error?: string;
}

export interface BulkScrapeRequest {
  queries: ScrapeRequest[];
}

export interface BulkScrapeResponse {
  success: boolean;
  results: ScrapeResponse[];
  total: number;
  successful: number;
  failed: number;
}

// ── Job / async pipeline types ───────────────────────────────────────────────

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface Job {
  id: string;
  status: JobStatus;
  sku: string;
  brand: Brand;
  error?: string;
  createdAt: string;
  completedAt?: string;
  product?: ProductResult;
}

export interface JobResponse {
  success: boolean;
  job?: Job;
  error?: string;
}

// ── Saved product row (from DB) ───────────────────────────────────────────────

export interface SavedProduct {
  id: string;
  jobId: string;
  sku: string;
  brand: Brand;
  title: string;
  price?: string;
  description?: string;
  specifications?: Record<string, string>;
  imageUrl?: string;
  productUrl?: string;
  availability?: string;
  rating?: string;
  scrapedAt: string;
}

export interface ProductsResponse {
  success: boolean;
  products: SavedProduct[];
  total: number;
  error?: string;
}
