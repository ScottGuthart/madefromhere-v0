import { sql } from '@/lib/db'
import type { Artwork, Show, SiteContent } from '@/lib/types'

export async function getArtworks(): Promise<Artwork[]> {
  const rows = await sql`
    SELECT * FROM artworks
    ORDER BY sort_order ASC, created_at DESC
  `
  return rows as Artwork[]
}

export async function getArtwork(id: number): Promise<Artwork | null> {
  const rows = await sql`SELECT * FROM artworks WHERE id = ${id} LIMIT 1`
  return (rows[0] as Artwork) ?? null
}

export async function getShows(): Promise<Show[]> {
  const rows = await sql`
    SELECT * FROM shows
    ORDER BY start_date ASC
  `
  return rows as Show[]
}

export async function getSiteContent(): Promise<SiteContent> {
  const rows = await sql`SELECT key, value FROM site_content`
  const content: SiteContent = {}
  for (const row of rows as { key: string; value: string }[]) {
    content[row.key] = row.value
  }
  return content
}
