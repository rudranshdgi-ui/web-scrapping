"use client";

import { ScrapeResponse } from "@/types";
import { useState } from "react";

const BRAND_COLORS: Record<string, string> = {
  samsung: "bg-blue-100 text-blue-800",
  lg: "bg-red-100 text-red-800",
  sony: "bg-gray-100 text-gray-800",
  motorola: "bg-indigo-100 text-indigo-800",
  micromax: "bg-orange-100 text-orange-800",
};

interface Props {
  result: ScrapeResponse;
}

export default function ProductCard({ result }: Props) {
  const [showSpecs, setShowSpecs] = useState(false);
  const { data } = result;

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <p className="text-red-500 text-sm">{result.error || "Unknown error"}</p>
      </div>
    );
  }

  const brandColor = BRAND_COLORS[data.brand] || "bg-gray-100 text-gray-800";
  const hasSpecs = data.specifications && Object.keys(data.specifications).length > 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-4 ${
      data.error ? "border-yellow-200" : "border-gray-200"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${brandColor}`}>
              {data.brand.charAt(0).toUpperCase() + data.brand.slice(1)}
            </span>
            <span className="text-xs text-gray-400 font-mono truncate">{data.sku}</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {data.title}
          </h3>
        </div>
        {data.imageUrl && (
          <img
            src={data.imageUrl}
            alt={data.title}
            className="w-16 h-16 object-contain rounded-lg bg-gray-50 flex-shrink-0 border border-gray-100"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </div>

      {/* Price & Availability */}
      {(data.price || data.availability) && (
        <div className="flex items-center gap-4">
          {data.price && (
            <span className="text-lg font-bold text-gray-900">{data.price}</span>
          )}
          {data.availability && (
            <span className="text-xs text-green-600 font-medium">{data.availability}</span>
          )}
        </div>
      )}

      {/* Description */}
      {data.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
          {data.description}
        </p>
      )}

      {/* Specs Toggle */}
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
              {Object.entries(data.specifications!).map(([key, val]) => (
                <div key={key} className="flex text-xs">
                  <span className="text-gray-500 w-1/2 shrink-0">{key}</span>
                  <span className="text-gray-800 font-medium">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error notice */}
      {data.error && (
        <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          {data.error}
        </div>
      )}

      {/* Link */}
      {data.productUrl && (
        <a
          href={data.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto text-xs text-blue-600 hover:underline truncate"
        >
          View on {data.brand.charAt(0).toUpperCase() + data.brand.slice(1)} &rarr;
        </a>
      )}
    </div>
  );
}
