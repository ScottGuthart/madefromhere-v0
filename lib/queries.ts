import { sql } from '@/lib/db'
import { ensureSchema } from '@/lib/schema'
import type { Artwork, ArtworkMedia, Collection, Show, SiteContent } from '@/lib/types'

export async function getArtworks(): Promise<Artwork[]> {
  await ensureSchema()
  const rows = await sql`
    SELECT * FROM artworks
    ORDER BY sort_order ASC, created_at DESC
  `
  return rows as Artwork[]
}

export async function getArtwork(id: number): Promise<Artwork | null> {
  await ensureSchema()
  const rows = await sql`SELECT * FROM artworks WHERE id = ${id} LIMIT 1`
  return (rows[0] as Artwork) ?? null
}

export async function getCollections(): Promise<Collection[]> {
  await ensureSchema()
  const rows = await sql`
    SELECT * FROM collections
    ORDER BY sort_order ASC, created_at DESC
  `
  return rows as Collection[]
}

export async function getCollection(id: number): Promise<Collection | null> {
  await ensureSchema()
  const rows = await sql`SELECT * FROM collections WHERE id = ${id} LIMIT 1`
  return (rows[0] as Collection) ?? null
}

// All media rows, grouped by artwork id. The gallery is small enough that
// fetching everything at once and grouping in memory is simpler (and just
// as fast) as a query per piece.
export async function getArtworkMediaByArtwork(): Promise<Map<number, ArtworkMedia[]>> {
  await ensureSchema()
  const rows = (await sql`
    SELECT * FROM artwork_media
    ORDER BY sort_order ASC, created_at ASC
  `) as ArtworkMedia[]

  const map = new Map<number, ArtworkMedia[]>()
  for (const row of rows) {
    const list = map.get(row.artwork_id)
    if (list) {
      list.push(row)
    } else {
      map.set(row.artwork_id, [row])
    }
  }
  return map
}

export async function getArtworkMedia(artworkId: number): Promise<ArtworkMedia[]> {
  await ensureSchema()
  const rows = await sql`
    SELECT * FROM artwork_media
    WHERE artwork_id = ${artworkId}
    ORDER BY sort_order ASC, created_at ASC
  `
  return rows as ArtworkMedia[]
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
