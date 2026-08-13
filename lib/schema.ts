import { sql } from '@/lib/db'

// This project has no separate migration tooling — schema changes ship as
// idempotent statements that run themselves on first use after a deploy.
// `ensureSchema` is safe to call as often as needed; the promise is cached
// per server instance so the DDL only actually runs once per warm lambda.
let ensured: Promise<void> | null = null

async function runMigrations() {
  await sql`
    CREATE TABLE IF NOT EXISTS collections (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      cover_image_url TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    ALTER TABLE artworks
      ADD COLUMN IF NOT EXISTS collection_id INTEGER
      REFERENCES collections(id) ON DELETE SET NULL
  `
  await sql`
    ALTER TABLE artworks
      ADD COLUMN IF NOT EXISTS created_date DATE
  `
  await sql`
    ALTER TABLE collections
      ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION
  `
  await sql`
    ALTER TABLE collections
      ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION
  `
  await sql`
    ALTER TABLE collections
      ADD COLUMN IF NOT EXISTS map_url TEXT
  `
  await sql`
    CREATE TABLE IF NOT EXISTS artwork_media (
      id SERIAL PRIMARY KEY,
      artwork_id INTEGER NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
      media_type TEXT NOT NULL DEFAULT 'image',
      url TEXT NOT NULL,
      caption TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
}

export function ensureSchema(): Promise<void> {
  if (!ensured) {
    ensured = runMigrations().catch((err) => {
      // Let the next call retry instead of caching a permanent failure.
      ensured = null
      throw err
    })
  }
  return ensured
}
