import axios from "axios";
import * as cheerio from "cheerio";
import { ProductResult } from "@/types";

export async function scrapeMotorol(sku: string): Promise<ProductResult> {
  const searchUrl = `https://www.motorola.in/products/search?q=${encodeURIComponent(sku)}`;

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
      $(".product-list .product-card a").first().attr("href") ||
      $('[class*="product"] a[href*="/in/"]').first().attr("href");

    let productUrl = productLink
      ? productLink.startsWith("http")
        ? productLink
        : `https://www.motorola.in${productLink}`
      : null;

    // Try direct product URL
    if (!productUrl) {
      const directUrl = `https://www.motorola.in/smartphones/moto-${sku.toLowerCase()}`;
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
        title: `Motorola ${sku}`,
        brand: "motorola",
        error: "Product not found on Motorola website",
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
        Referer: "https://www.motorola.in",
      },
      timeout: 15000,
    });

    const $p = cheerio.load(productHtml);

    const title =
      $p("h1.product-name").text().trim() ||
      $p("h1.hero-title").text().trim() ||
      $p("h1").first().text().trim() ||
      `Motorola ${sku}`;

    const price =
      $p(".price-info .current-price").text().trim() ||
      $p('[class*="price"]').first().text().trim() ||
      undefined;

    const description =
      $p(".product-description").text().trim() ||
      $p('meta[name="description"]').attr("content") ||
      undefined;

    const imageUrl =
      $p(".hero-image img").attr("src") ||
      $p('meta[property="og:image"]').attr("content") ||
      undefined;

    const availability =
      $p(".buy-now-btn, .add-to-cart").first().text().trim() || undefined;

    const specifications: Record<string, string> = {};
    $p(".specs-container .spec-row").each((_, el) => {
      const key = $p(el).find(".spec-label").text().trim();
      const val = $p(el).find(".spec-value").text().trim();
      if (key && val) specifications[key] = val;
    });

    return {
      sku,
      title,
      brand: "motorola",
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
      title: `Motorola ${sku}`,
      brand: "motorola",
      error: `Scraping failed: ${message}`,
      productUrl: searchUrl,
    };
  }
}
