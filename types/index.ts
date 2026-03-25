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
