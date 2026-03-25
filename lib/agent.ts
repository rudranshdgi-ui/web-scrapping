/**
 * AI-powered product data extractor.
 * Uses Claude to clean and normalise raw scraped data.
 * Falls back to raw data if ANTHROPIC_API_KEY is not configured.
 */
import Anthropic from "@anthropic-ai/sdk";
import { ProductResult } from "@/types";

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

interface ExtractedFields {
  title?: string;
  price?: string;
  description?: string;
  availability?: string;
  specifications?: Record<string, string>;
}

export async function extractProductData(raw: ProductResult): Promise<ProductResult> {
  const ai = getClient();
  if (!ai) return raw; // No API key — skip AI step

  const prompt = `You are a product data extraction assistant. Given the following scraped product data, return a cleaned and normalised JSON object.

SKU: ${raw.sku}
Brand: ${raw.brand}
Raw data:
${JSON.stringify(raw, null, 2)}

Return ONLY a JSON object (no markdown, no code fences) with these fields:
{
  "title": "clean, marketing-friendly product title",
  "price": "price with currency symbol, e.g. ₹24,999 or null",
  "description": "1–2 sentence product summary or null",
  "availability": "In Stock / Out of Stock / Pre-order or null",
  "specifications": { "key": "value", ... } or {}
}
Fill in as much as you can from the raw data. Do NOT invent data that isn't present.`;

  try {
    const message = await ai.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return raw;

    const extracted: ExtractedFields = JSON.parse(jsonMatch[0]);
    return {
      ...raw,
      title: extracted.title || raw.title,
      price: extracted.price || raw.price,
      description: extracted.description || raw.description,
      availability: extracted.availability || raw.availability,
      specifications: extracted.specifications || raw.specifications,
    };
  } catch {
    // AI failed — return raw scraped data unchanged
    return raw;
  }
}
