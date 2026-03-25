import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product Scraper - Samsung, LG, Sony, Motorola, Micromax",
  description: "Scrape product data by SKU from Samsung, LG, Sony, Motorola, and Micromax websites",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
