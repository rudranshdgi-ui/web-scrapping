"use client";

import { useState } from "react";
import { Brand, ScrapeRequest } from "@/types";
import { SUPPORTED_BRANDS } from "@/lib/scraper";

interface Props {
  onSubmit: (queries: ScrapeRequest[]) => void;
  loading: boolean;
}

export default function BulkScrapeForm({ onSubmit, loading }: Props) {
  const [rows, setRows] = useState<ScrapeRequest[]>([
    { sku: "", brand: "samsung" },
  ]);
  const [csvText, setCsvText] = useState("");
  const [mode, setMode] = useState<"form" | "csv">("form");

  const addRow = () => {
    if (rows.length >= 20) return;
    setRows([...rows, { sku: "", brand: "samsung" }]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof ScrapeRequest, value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = rows.filter((r) => r.sku.trim());
    if (valid.length === 0) return;
    onSubmit(valid);
  };

  const handleCsvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = csvText.trim().split("\n").filter(Boolean);
    const queries: ScrapeRequest[] = [];

    for (const line of lines) {
      const [sku, brand] = line.split(",").map((s) => s.trim());
      if (sku && brand) {
        const validBrands = SUPPORTED_BRANDS.map((b) => b.value);
        if (validBrands.includes(brand as Brand)) {
          queries.push({ sku, brand: brand as Brand });
        }
      }
    }

    if (queries.length > 0) onSubmit(queries.slice(0, 20));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Bulk Scrape</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("form")}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              mode === "form"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Form
          </button>
          <button
            type="button"
            onClick={() => setMode("csv")}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              mode === "csv"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            CSV
          </button>
        </div>
      </div>

      {mode === "form" && (
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-3 mb-4">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-3 items-center">
                <span className="text-xs text-gray-400 w-6 text-right shrink-0">{i + 1}</span>
                <input
                  type="text"
                  value={row.sku}
                  onChange={(e) => updateRow(i, "sku", e.target.value)}
                  placeholder="SKU / Model Number"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={row.brand}
                  onChange={(e) => updateRow(i, "brand", e.target.value)}
                  className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {SUPPORTED_BRANDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none shrink-0"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={addRow}
              disabled={rows.length >= 20}
              className="text-sm text-blue-600 font-medium hover:underline disabled:opacity-40 disabled:no-underline"
            >
              + Add row
            </button>
            <span className="text-xs text-gray-400">{rows.length}/20 max</span>
            <button
              type="submit"
              disabled={loading}
              className="ml-auto bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Scraping..." : `Scrape ${rows.filter((r) => r.sku.trim()).length} Products`}
            </button>
          </div>
        </form>
      )}

      {mode === "csv" && (
        <form onSubmit={handleCsvSubmit}>
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">
              Format: one product per line as <code className="bg-gray-100 px-1 rounded">SKU,brand</code>
              <br />
              Example: <code className="bg-gray-100 px-1 rounded">SM-G991B,samsung</code>
            </p>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"SM-G991B,samsung\nXperia 1 V,sony\nMoto G84,motorola"}
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !csvText.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Scraping..." : "Scrape from CSV"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
