import axios from "axios";
import * as cheerio from "cheerio";
import { ProductResult } from "@/types";

export async function scrapeMicromax(sku: string): Promise<ProductResult> {
  const searchUrl = `https://www.micromaxinfo.com/mobiles?search=${encodeURIComponent(sku)}`;

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
      $(".product-grid .product-item a").first().attr("href") ||
      $('[class*="product"] a').first().attr("href");

    let productUrl = productLink
      ? productLink.startsWith("http")
        ? productLink
        : `https://www.micromaxinfo.com${productLink}`
      : null;

    if (!productUrl) {
      // Try direct URL pattern
      const directUrl = `https://www.micromaxinfo.com/mobiles/${sku.toLowerCase()}`;
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
        title: `Micromax ${sku}`,
        brand: "micromax",
        error: "Product not found on Micromax website",
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
        Referer: "https://www.micromaxinfo.com",
      },
      timeout: 15000,
    });

    const $p = cheerio.load(productHtml);

    const title =
      $p("h1.product-title").text().trim() ||
      $p("h1.phone-name").text().trim() ||
      $p("h1").first().text().trim() ||
      `Micromax ${sku}`;

    const price =
      $p(".product-price").text().trim() ||
      $p('[class*="price"]').first().text().trim() ||
      undefined;

    const description =
      $p(".product-description").text().trim() ||
      $p('meta[name="description"]').attr("content") ||
      undefined;

    const imageUrl =
      $p(".product-image img").first().attr("src") ||
      $p('meta[property="og:image"]').attr("content") ||
      undefined;

    const availability =
      $p(".buy-btn, .order-btn").first().text().trim() || undefined;

    const specifications: Record<string, string> = {};
    $p(".specifications-table tr, .spec-table tr").each((_, el) => {
      const key = $p(el).find("td:first-child, th:first-child").text().trim();
      const val = $p(el).find("td:last-child").text().trim();
      if (key && val && key !== val) specifications[key] = val;
    });

    return {
      sku,
      title,
      brand: "micromax",
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
      title: `Micromax ${sku}`,
      brand: "micromax",
      error: `Scraping failed: ${message}`,
      productUrl: searchUrl,
    };
  }
}
