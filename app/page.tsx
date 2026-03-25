"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Brand, BulkScrapeResponse, Job, SavedProduct, ScrapeRequest } from "@/types";
import { SUPPORTED_BRANDS } from "@/lib/scraper";
import ProductCard from "@/components/ProductCard";
import BulkScrapeForm from "@/components/BulkScrapeForm";
import SavedProductCard from "@/components/SavedProductCard";

type Tab = "single" | "bulk" | "saved";

// ── Job polling hook ──────────────────────────────────────────────────────────
function useJobPolling(jobIds: string[]) {
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(
    async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => fetch(`/api/jobs/${id}`).then((r) => r.json()))
      );
      setJobs((prev) => {
        const next = { ...prev };
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value.success) {
            next[ids[i]] = r.value.job as Job;
          }
        });
        return next;
      });
    },
    []
  );

  const key = jobIds.join(",");
  useEffect(() => {
    if (!jobIds.length) return;
    fetchJobs(jobIds);
    intervalRef.current = setInterval(() => {
      setJobs((current) => {
        const pending = jobIds.filter(
          (id) => !current[id] || current[id].status === "pending" || current[id].status === "running"
        );
        if (!pending.length) {
          clearInterval(intervalRef.current!);
          return current;
        }
        fetchJobs(pending);
        return current;
      });
    }, 2500);
    return () => clearInterval(intervalRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return jobs;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState<Brand>("samsung");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BulkScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("single");

  // Async job tracking
  const [pendingJobIds, setPendingJobIds] = useState<string[]>([]);
  const jobResults = useJobPolling(pendingJobIds);

  // Saved products
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [savedTotal, setSavedTotal] = useState(0);
  const [savedLoading, setSavedLoading] = useState(false);

  const loadSaved = async () => {
    setSavedLoading(true);
    try {
      const res = await fetch("/api/products?limit=50");
      const data = await res.json();
      if (data.success) {
        setSavedProducts(data.products);
        setSavedTotal(data.total);
      }
    } finally {
      setSavedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "saved") loadSaved();
  }, [activeTab]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSingleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    setPendingJobIds([]);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries: [{ sku, brand }] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to scrape product");
      } else if (data.async && data.jobIds?.length) {
        setPendingJobIds(data.jobIds);
      } else {
        setResponse(data);
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
    setPendingJobIds([]);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to scrape products");
      } else if (data.async && data.jobIds?.length) {
        setPendingJobIds(data.jobIds);
      } else {
        setResponse(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const finishedJobs = pendingJobIds.map((id) => jobResults[id]).filter(Boolean);
  const pendingCount = finishedJobs.filter(
    (j) => j.status === "pending" || j.status === "running"
  ).length;

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
            {(["single", "bulk", "saved"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab === "saved"
                  ? `Saved Products${savedTotal ? ` (${savedTotal})` : ""}`
                  : tab === "single"
                  ? "Single Product"
                  : "Bulk Scrape"}
              </button>
            ))}
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

        {/* Saved Products Tab */}
        {activeTab === "saved" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {savedTotal} product{savedTotal !== 1 ? "s" : ""} saved in database
              </p>
              <button
                onClick={loadSaved}
                disabled={savedLoading}
                className="text-sm text-blue-600 hover:underline disabled:opacity-50"
              >
                {savedLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
            {savedProducts.length === 0 && !savedLoading && (
              <div className="text-center py-16 text-gray-400 text-sm">
                No saved products yet. Scrape some products first (requires DATABASE_URL).
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {savedProducts.map((p) => (
                <SavedProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Async job status */}
        {pendingJobIds.length > 0 && activeTab !== "saved" && (
          <div className="mb-6">
            {pendingCount > 0 && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm mb-4">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                Scraping {pendingCount} product{pendingCount !== 1 ? "s" : ""}…
              </div>
            )}
            {finishedJobs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Results ({finishedJobs.length})
                  </h2>
                  <div className="flex gap-3 text-sm">
                    <span className="text-green-600 font-medium">
                      {finishedJobs.filter((j) => j.status === "completed").length} done
                    </span>
                    {finishedJobs.filter((j) => j.status === "failed").length > 0 && (
                      <span className="text-red-500 font-medium">
                        {finishedJobs.filter((j) => j.status === "failed").length} failed
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {finishedJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Synchronous results (no DATABASE_URL) */}
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
                  <span className="text-red-500 font-medium">{response.failed} failed</span>
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

// ── Inline JobCard ─────────────────────────────────────────────────────────────
function JobCard({ job }: { job: Job }) {
  if (job.status === "pending" || job.status === "running") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 flex items-center gap-3 text-sm text-blue-700">
        <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full shrink-0" />
        Scraping {job.brand} · {job.sku}…
      </div>
    );
  }
  if (job.status === "failed") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <p className="text-xs font-mono text-gray-400 mb-1">
          {job.brand} · {job.sku}
        </p>
        <p className="text-red-500 text-sm">{job.error || "Scraping failed"}</p>
      </div>
    );
  }
  if (job.product) {
    return <ProductCard result={{ success: true, data: job.product }} />;
  }
  return null;
}
