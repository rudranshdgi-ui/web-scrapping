"use client";

import { useState } from "react";
import { Brand, BulkScrapeResponse, ScrapeRequest } from "@/types";
import { SUPPORTED_BRANDS } from "@/lib/scraper";
import ProductCard from "@/components/ProductCard";
import BulkScrapeForm from "@/components/BulkScrapeForm";

export default function Home() {
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState<Brand>("samsung");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BulkScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  const handleSingleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(`/api/scrape?sku=${encodeURIComponent(sku)}&brand=${brand}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to scrape product");
      } else {
        setResponse({
          success: true,
          results: [{ success: data.success, data: data.data, error: data.error }],
          total: 1,
          successful: data.success ? 1 : 0,
          failed: data.success ? 0 : 1,
        });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkScrape = async (queries: ScrapeRequest[]) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to scrape products");
      } else {
        setResponse(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Product Scraper</h1>
          <p className="mt-1 text-sm text-gray-500">
            Scrape product data from Samsung, LG, Sony, Motorola, and Micromax
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("single")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "single"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Single Product
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "bulk"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Bulk Scrape
            </button>
          </nav>
        </div>

        {/* Single Product Form */}
        {activeTab === "single" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Search by SKU</h2>
            <form onSubmit={handleSingleScrape} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU / Model Number
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g., SM-G991B, Xperia 1 V, Moto G84"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="sm:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value as Brand)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {SUPPORTED_BRANDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:self-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Scraping..." : "Scrape"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Scrape Form */}
        {activeTab === "bulk" && (
          <BulkScrapeForm onSubmit={handleBulkScrape} loading={loading} />
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {response && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Results ({response.total} total)
              </h2>
              <div className="flex gap-3 text-sm">
                <span className="text-green-600 font-medium">
                  {response.successful} successful
                </span>
                {response.failed > 0 && (
                  <span className="text-red-500 font-medium">
                    {response.failed} failed
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {response.results.map((result, i) => (
                <ProductCard key={i} result={result} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
