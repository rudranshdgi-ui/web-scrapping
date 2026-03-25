import axios from "axios";
import * as cheerio from "cheerio";
import { ProductResult } from "@/types";

export async function scrapeSamsung(sku: string): Promise<ProductResult> {
  const searchUrl = `https://www.samsung.com/in/search/?searchvalue=${encodeURIComponent(sku)}`;

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
    const firstResult = $(".results-content .card-product").first();
    const productLink = firstResult.find("a").attr("href");

    let productUrl = productLink
      ? productLink.startsWith("http")
        ? productLink
        : `https://www.samsung.com${productLink}`
      : null;

    if (!productUrl) {
      // Try API endpoint
      const apiUrl = `https://www.samsung.com/in/search/searchMain.do?listType=G&type=ALL&keyword=${encodeURIComponent(sku)}&start=1&num=1`;
      const { data: apiData } = await axios.get(apiUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.samsung.com/in/",
        },
        timeout: 10000,
      });

      if (apiData?.results?.items?.[0]?.url) {
        productUrl = `https://www.samsung.com${apiData.results.items[0].url}`;
      }
    }

    if (!productUrl) {
      return {
        sku,
        title: `Samsung ${sku}`,
        brand: "samsung",
        error: "Product not found on Samsung website",
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
      },
      timeout: 15000,
    });

    const $p = cheerio.load(productHtml);

    const title =
      $p("h1.pd-title").text().trim() ||
      $p('h1[class*="title"]').text().trim() ||
      $p("h1").first().text().trim() ||
      `Samsung ${sku}`;

    const price =
      $p(".pd-price .price-unit").text().trim() ||
      $p('[class*="price"]').first().text().trim() ||
      undefined;

    const description =
      $p(".pd-description").text().trim() ||
      $p('[class*="description"]').first().text().trim() ||
      $p('meta[name="description"]').attr("content") ||
      undefined;

    const imageUrl =
      $p(".pd-image img").attr("src") ||
      $p('meta[property="og:image"]').attr("content") ||
      undefined;

    const availability =
      $p(".buy-area .btn-buy").text().trim() || undefined;

    const specifications: Record<string, string> = {};
    $p(".spec-highlight-cont .spec-highlight-item").each((_, el) => {
      const key = $p(el).find(".spec-highlight-title").text().trim();
      const val = $p(el).find(".spec-highlight-value").text().trim();
      if (key && val) specifications[key] = val;
    });

    return {
      sku,
      title,
      brand: "samsung",
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
      title: `Samsung ${sku}`,
      brand: "samsung",
      error: `Scraping failed: ${message}`,
      productUrl: searchUrl,
    };
  }
}
