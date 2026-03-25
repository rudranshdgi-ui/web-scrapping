import { Brand, ProductResult, ScrapeRequest } from "@/types";
import { scrapeSamsung } from "./scrapers/samsung";
import { scrapeLG } from "./scrapers/lg";
import { scrapeSony } from "./scrapers/sony";
import { scrapeMotorol } from "./scrapers/motorola";
import { scrapeMicromax } from "./scrapers/micromax";

export async function scrapeProduct(request: ScrapeRequest): Promise<ProductResult> {
  const { sku, brand } = request;

  switch (brand as Brand) {
    case "samsung":
      return scrapeSamsung(sku);
    case "lg":
      return scrapeLG(sku);
    case "sony":
      return scrapeSony(sku);
    case "motorola":
      return scrapeMotorol(sku);
    case "micromax":
      return scrapeMicromax(sku);
    default:
      return {
        sku,
        title: sku,
        brand,
        error: `Unsupported brand: ${brand}`,
      };
  }
}

export const SUPPORTED_BRANDS: { value: Brand; label: string }[] = [
  { value: "samsung", label: "Samsung" },
  { value: "lg", label: "LG" },
  { value: "sony", label: "Sony" },
  { value: "motorola", label: "Motorola" },
  { value: "micromax", label: "Micromax" },
];
