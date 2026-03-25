"use client";

import { useState } from "react";
import { SavedProduct } from "@/types";

const BRAND_COLORS: Record<string, string> = {
  samsung: "bg-blue-100 text-blue-800",
  lg: "bg-red-100 text-red-800",
  sony: "bg-gray-100 text-gray-800",
  motorola: "bg-indigo-100 text-indigo-800",
  micromax: "bg-orange-100 text-orange-800",
};

interface Props {
  product: SavedProduct;
}

export default function SavedProductCard({ product: p }: Props) {
  const [showSpecs, setShowSpecs] = useState(false);
  const brandColor = BRAND_COLORS[p.brand] || "bg-gray-100 text-gray-800";
  const hasSpecs = p.specifications && Object.keys(p.specifications).length > 0;
  const scrapedDate = new Date(p.scrapedAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${brandColor}`}>
              {p.brand.charAt(0).toUpperCase() + p.brand.slice(1)}
            </span>
            <span className="text-xs text-gray-400 font-mono truncate">{p.sku}</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {p.title}
          </h3>
        </div>
        {p.imageUrl && (
          <img
            src={p.imageUrl}
            alt={p.title}
            className="w-16 h-16 object-contain rounded-lg bg-gray-50 flex-shrink-0 border border-gray-100"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </div>

      {/* Price & Availability */}
      {(p.price || p.availability) && (
        <div className="flex items-center gap-4">
          {p.price && <span className="text-lg font-bold text-gray-900">{p.price}</span>}
          {p.availability && (
            <span className="text-xs text-green-600 font-medium">{p.availability}</span>
          )}
        </div>
      )}

      {/* Description */}
      {p.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{p.description}</p>
      )}

      {/* Specs */}
      {hasSpecs && (
        <div>
          <button
            onClick={() => setShowSpecs(!showSpecs)}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            {showSpecs ? "Hide" : "Show"} Specifications
          </button>
          {showSpecs && (
            <div className="mt-2 space-y-1">
              {Object.entries(p.specifications!).map(([key, val]) => (
                <div key={key} className="flex text-xs">
                  <span className="text-gray-500 w-1/2 shrink-0">{key}</span>
                  <span className="text-gray-800 font-medium">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
        <span>Scraped {scrapedDate}</span>
        {p.productUrl && (
          <a
            href={p.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
