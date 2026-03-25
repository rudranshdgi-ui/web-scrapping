/**
 * One-time database initialisation script.
 * Run with:  npx tsx lib/db-init.ts
 */
import { getPool } from "./db";

async function init() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scrape_jobs (
      id          TEXT        PRIMARY KEY,
      status      TEXT        NOT NULL DEFAULT 'pending',
      sku         TEXT        NOT NULL,
      brand       TEXT        NOT NULL,
      error       TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS products (
      id            TEXT        PRIMARY KEY,
      job_id        TEXT        REFERENCES scrape_jobs(id),
      sku           TEXT        NOT NULL,
      brand         TEXT        NOT NULL,
      title         TEXT,
      price         TEXT,
      description   TEXT,
      specifications JSONB,
      image_url     TEXT,
      product_url   TEXT,
      availability  TEXT,
      rating        TEXT,
      scraped_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_products_sku   ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
    CREATE INDEX IF NOT EXISTS idx_jobs_status    ON scrape_jobs(status);
  `);

  console.log("✓ Database tables created (or already exist)");
  await pool.end();
}

init().catch((err) => {
  console.error("DB init failed:", err);
  process.exit(1);
});
