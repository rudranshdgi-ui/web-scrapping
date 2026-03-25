import axios from "axios";
import * as cheerio from "cheerio";
import { ProductResult } from "@/types";

export async function scrapeLG(sku: string): Promise<ProductResult> {
  const searchUrl = `https://www.lg.com/in/search?search=${encodeURIComponent(sku)}`;

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
        Referer: "https://www.lg.com/in",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(searchHtml);

    // Try to find product link from search results
    const productLink =
      $(".search-results .product-card a").first().attr("href") ||
      $('[class*="product"] a[href*="/in/"]').first().attr("href");

    let productUrl = productLink
      ? productLink.startsWith("http")
        ? productLink
        : `https://www.lg.com${productLink}`
      : null;

    if (!productUrl) {
      // Try LG product API
      const apiUrl = `https://www.lg.com/in/ajax/search?category=MOBILE_PHONES&keyword=${encodeURIComponent(sku)}`;
      try {
        const { data: apiData } = await axios.get(apiUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 AppleWebKit/537.36",
            Referer: "https://www.lg.com/in",
          },
          timeout: 10000,
        });
        if (apiData?.results?.[0]?.modelUrl) {
          productUrl = `https://www.lg.com${apiData.results[0].modelUrl}`;
        }
      } catch {
        // API not available
      }
    }

    if (!productUrl) {
      return {
        sku,
        title: `LG ${sku}`,
        brand: "lg",
        error: "Product not found on LG website",
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
        Referer: "https://www.lg.com/in",
      },
      timeout: 15000,
    });

    const $p = cheerio.load(productHtml);

    const title =
      $p("h1.model-name").text().trim() ||
      $p("h1.product-name").text().trim() ||
      $p("h1").first().text().trim() ||
      `LG ${sku}`;

    const price =
      $p(".price-area .sale-price").text().trim() ||
      $p('[class*="price"]').first().text().trim() ||
      undefined;

    const description =
      $p(".product-description").text().trim() ||
      $p('meta[name="description"]').attr("content") ||
      undefined;

    const imageUrl =
      $p(".product-image img").attr("src") ||
      $p('meta[property="og:image"]').attr("content") ||
      undefined;

    const availability =
      $p(".buy-section .btn-buy").text().trim() || undefined;

    const specifications: Record<string, string> = {};
    $p(".spec-list .spec-item").each((_, el) => {
      const key = $p(el).find(".spec-title").text().trim();
      const val = $p(el).find(".spec-value").text().trim();
      if (key && val) specifications[key] = val;
    });

    return {
      sku,
      title,
      brand: "lg",
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
      title: `LG ${sku}`,
      brand: "lg",
      error: `Scraping failed: ${message}`,
      productUrl: searchUrl,
    };
  }
}
