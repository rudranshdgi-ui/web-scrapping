import axios from "axios";
import * as cheerio from "cheerio";
import { ProductResult } from "@/types";

export async function scrapeSony(sku: string): Promise<ProductResult> {
  const searchUrl = `https://www.sony.co.in/en/search?q=${encodeURIComponent(sku)}`;

  try {
    const { data: searchHtml } = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(searchHtml);

    const productLink =
      $(".search-results-list .product-item a").first().attr("href") ||
      $('[class*="search"] [class*="product"] a').first().attr("href");

    let productUrl = productLink
      ? productLink.startsWith("http")
        ? productLink
        : `https://www.sony.co.in${productLink}`
      : null;

    // Try direct product URL by SKU
    if (!productUrl) {
      const directUrl = `https://www.sony.co.in/en/products/mobile-phones/${sku.toLowerCase()}`;
      try {
        const { status } = await axios.head(directUrl, {
          headers: { "User-Agent": "Mozilla/5.0 AppleWebKit/537.36" },
          timeout: 8000,
        });
        if (status === 200) productUrl = directUrl;
      } catch {
        // Not found
      }
    }

    if (!productUrl) {
      return {
        sku,
        title: `Sony ${sku}`,
        brand: "sony",
        error: "Product not found on Sony website",
        productUrl: searchUrl,
      };
    }

    const { data: productHtml } = await axios.get(productUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://www.sony.co.in",
      },
      timeout: 15000,
    });

    const $p = cheerio.load(productHtml);

    const title =
      $p("h1.product-title").text().trim() ||
      $p("h1.pdp-title").text().trim() ||
      $p("h1").first().text().trim() ||
      `Sony ${sku}`;

    const price =
      $p(".product-price .price").text().trim() ||
      $p('[class*="price"]').first().text().trim() ||
      undefined;

    const description =
      $p(".product-description-text").text().trim() ||
      $p(".pdp-description").text().trim() ||
      $p('meta[name="description"]').attr("content") ||
      undefined;

    const imageUrl =
      $p(".product-image-container img").first().attr("src") ||
      $p('meta[property="og:image"]').attr("content") ||
      undefined;

    const availability =
      $p(".add-to-cart-btn").text().trim() || undefined;

    const specifications: Record<string, string> = {};
    $p(".product-specs table tr").each((_, el) => {
      const key = $p(el).find("td:first-child, th:first-child").text().trim();
      const val = $p(el).find("td:last-child").text().trim();
      if (key && val && key !== val) specifications[key] = val;
    });

    return {
      sku,
      title,
      brand: "sony",
      price,
      description,
      imageUrl,
      productUrl,
      availability,
      specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      sku,
      title: `Sony ${sku}`,
      brand: "sony",
      error: `Scraping failed: ${message}`,
      productUrl: searchUrl,
    };
  }
}
