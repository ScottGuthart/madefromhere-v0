'use server'

import { del } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import { sql } from '@/lib/db'
import { ensureSchema } from '@/lib/schema'
import { isAuthenticated } from '@/lib/auth'
import { parseGoogleMapsUrl } from '@/lib/geo'

async function requireAuth() {
  if (!(await isAuthenticated())) {
    throw new Error('Unauthorized')
  }
}

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/gallery')
  revalidatePath('/gallery/[id]', 'page')
  revalidatePath('/shows')
  revalidatePath('/about')
  revalidatePath('/studio')
}

async function deleteBlobIfOwned(url: string | null | undefined) {
  if (url && url.includes('blob.vercel-storage.com')) {
    try {
      await del(url)
    } catch {
      // ignore blob deletion failures
    }
  }
}

function parseCoord(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// The browser can't follow a shortened Google Maps link (maps.app.goo.gl/...
// — what the phone's Share sheet usually gives you) to get real
// coordinates out of it; that's a cross-origin redirect the browser won't
// expose. The server has no such restriction, so if the client didn't
// already resolve coordinates, follow the link here as a fallback.
async function resolveMapUrlCoords(url: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    res.body?.cancel().catch(() => {})
    return parseGoogleMapsUrl(res.url)
  } catch {
    return null
  }
}

/* ---------- Collections ----------
 *
 * Photo/video uploads happen client-side (see lib/blob-client.ts + the
 * /api/upload route) so these actions only ever receive small text fields —
 * a Server Action's request body is capped around 4.5MB on Vercel, which a
 * raw iPhone photo or video can easily exceed.
 */

export async function createCollection(formData: FormData) {
  await requireAuth()
  await ensureSchema()

  const title = String(formData.get('title') ?? '').trim() || 'Untitled place'
  const description = String(formData.get('description') ?? '').trim()
  const coverUrl = String(formData.get('cover_image_url') ?? '').trim()
  let latitude = parseCoord(formData.get('latitude'))
  let longitude = parseCoord(formData.get('longitude'))
  const mapUrl = String(formData.get('map_url') ?? '').trim() || null

  if (latitude == null && longitude == null && mapUrl) {
    const resolved = await resolveMapUrlCoords(mapUrl)
    if (resolved) {
      latitude = resolved.lat
      longitude = resolved.lng
    }
  }

  const maxRows = await sql`SELECT COALESCE(MAX(sort_order), 0) AS max FROM collections`
  const sortOrder = Number((maxRows[0] as { max: number }).max) + 1

  await sql`
    INSERT INTO collections (title, description, cover_image_url, sort_order, latitude, longitude, map_url)
    VALUES (${title}, ${description}, ${coverUrl}, ${sortOrder}, ${latitude}, ${longitude}, ${mapUrl})
  `
  revalidateAll()
}

export async function updateCollection(formData: FormData) {
  await requireAuth()
  await ensureSchema()

  const id = Number(formData.get('id'))
  const title = String(formData.get('title') ?? '').trim() || 'Untitled place'
  const description = String(formData.get('description') ?? '').trim()
  const newCoverUrl = String(formData.get('cover_image_url') ?? '').trim()
  let latitude = parseCoord(formData.get('latitude'))
  let longitude = parseCoord(formData.get('longitude'))
  const mapUrl = String(formData.get('map_url') ?? '').trim() || null

  if (latitude == null && longitude == null && mapUrl) {
    const resolved = await resolveMapUrlCoords(mapUrl)
    if (resolved) {
      latitude = resolved.lat
      longitude = resolved.lng
    }
  }

  if (newCoverUrl) {
    const rows = await sql`SELECT cover_image_url FROM collections WHERE id = ${id}`
    await deleteBlobIfOwned((rows[0] as { cover_image_url: string })?.cover_image_url)

    await sql`
      UPDATE collections
      SET title = ${title}, description = ${description}, cover_image_url = ${newCoverUrl},
          latitude = ${latitude}, longitude = ${longitude}, map_url = ${mapUrl}
      WHERE id = ${id}
    `
  } else {
    await sql`
      UPDATE collections
      SET title = ${title}, description = ${description},
          latitude = ${latitude}, longitude = ${longitude}, map_url = ${mapUrl}
      WHERE id = ${id}
    `
  }
  revalidateAll()
}

export async function deleteCollection(formData: FormData) {
  await requireAuth()
  await ensureSchema()
  const id = Number(formData.get('id'))

  const rows = await sql`SELECT cover_image_url FROM collections WHERE id = ${id}`
  await deleteBlobIfOwned((rows[0] as { cover_image_url: string })?.cover_image_url)

  // Pieces in this collection are not deleted — they just become unassigned.
  await sql`DELETE FROM collections WHERE id = ${id}`
  revalidateAll()
}

/* ---------- Artworks ---------- */

export async function createArtwork(formData: FormData) {
  await requireAuth()
  await ensureSchema()

  const imageUrl = String(formData.get('image_url') ?? '').trim()

  if (!imageUrl) {
    throw new Error('An image is required')
  }

  const title = String(formData.get('title') ?? '').trim() || 'Untitled'
  const description = String(formData.get('description') ?? '').trim()
  const medium = String(formData.get('medium') ?? '').trim()
  const year = String(formData.get('year') ?? '').trim()
  const createdDate = String(formData.get('created_date') ?? '').trim() || null
  const status = String(formData.get('status') ?? 'available')
  const collectionRaw = String(formData.get('collection_id') ?? '').trim()
  const collectionId = collectionRaw ? Number(collectionRaw) : null

  const maxRows = await sql`SELECT COALESCE(MAX(sort_order), 0) AS max FROM artworks`
  const sortOrder = Number((maxRows[0] as { max: number }).max) + 1

  await sql`
    INSERT INTO artworks (title, description, image_url, medium, year, created_date, status, sort_order, collection_id)
    VALUES (${title}, ${description}, ${imageUrl}, ${medium}, ${year}, ${createdDate}, ${status}, ${sortOrder}, ${collectionId})
  `
  revalidateAll()
}

export async function updateArtwork(formData: FormData) {
  await requireAuth()
  await ensureSchema()

  const id = Number(formData.get('id'))
  const title = String(formData.get('title') ?? '').trim() || 'Untitled'
  const description = String(formData.get('description') ?? '').trim()
  const medium = String(formData.get('medium') ?? '').trim()
  const year = String(formData.get('year') ?? '').trim()
  const createdDate = String(formData.get('created_date') ?? '').trim() || null
  const status = String(formData.get('status') ?? 'available')
  const collectionRaw = String(formData.get('collection_id') ?? '').trim()
  const collectionId = collectionRaw ? Number(collectionRaw) : null

  await sql`
    UPDATE artworks
    SET title = ${title}, description = ${description}, medium = ${medium},
        year = ${year}, created_date = ${createdDate}, status = ${status}, collection_id = ${collectionId}
    WHERE id = ${id}
  `
  revalidateAll()
}

export async function deleteArtwork(formData: FormData) {
  await requireAuth()
  await ensureSchema()
  const id = Number(formData.get('id'))

  const rows = await sql`SELECT image_url FROM artworks WHERE id = ${id}`
  await deleteBlobIfOwned((rows[0] as { image_url: string })?.image_url)

  const mediaRows = await sql`SELECT url FROM artwork_media WHERE artwork_id = ${id}`
  for (const row of mediaRows as { url: string }[]) {
    await deleteBlobIfOwned(row.url)
  }

  // artwork_media rows cascade-delete with the artwork.
  await sql`DELETE FROM artworks WHERE id = ${id}`
  revalidateAll()
}

// Swaps a piece with its neighbor in the same order used everywhere the
// gallery is displayed (getArtworks' ORDER BY) — so this one control
// reorders it on the homepage's Recent work, the Gallery page, and within
// its place, all at once.
export async function reorderArtwork(formData: FormData) {
  await requireAuth()
  await ensureSchema()

  const id = Number(formData.get('id'))
  const direction = String(formData.get('direction') ?? '')

  const all = (await sql`
    SELECT id, sort_order FROM artworks
    ORDER BY sort_order ASC, created_at DESC
  `) as { id: number; sort_order: number }[]

  const index = all.findIndex((a) => a.id === id)
  const swapIndex = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || swapIndex < 0 || swapIndex >= all.length) return

  const neighbor = all[swapIndex]
  const self = all[index]

  await sql`UPDATE artworks SET sort_order = ${neighbor.sort_order} WHERE id = ${self.id}`
  await sql`UPDATE artworks SET sort_order = ${self.sort_order} WHERE id = ${neighbor.id}`
  revalidateAll()
}

/* ---------- Artwork media (carousel photos/videos) ---------- */

export async function addArtworkMedia(formData: FormData) {
  await requireAuth()
  await ensureSchema()

  const artworkId = Number(formData.get('artwork_id'))
  const itemsRaw = String(formData.get('items') ?? '[]')
  let items: { url: string; media_type: 'image' | 'video' }[]
  try {
    items = JSON.parse(itemsRaw)
  } catch {
    items = []
  }
  items = items.filter((i) => i && typeof i.url === 'string' && i.url.trim())
  if (items.length === 0) {
    throw new Error('Choose at least one photo or video')
  }

  const maxRows = await sql`
    SELECT COALESCE(MAX(sort_order), 0) AS max FROM artwork_media WHERE artwork_id = ${artworkId}
  `
  let nextOrder = Number((maxRows[0] as { max: number }).max) + 1

  for (const item of items) {
    const mediaType = item.media_type === 'video' ? 'video' : 'image'
    await sql`
      INSERT INTO artwork_media (artwork_id, media_type, url, sort_order)
      VALUES (${artworkId}, ${mediaType}, ${item.url}, ${nextOrder})
    `
    nextOrder += 1
  }
  revalidateAll()
}

export async function deleteArtworkMedia(formData: FormData) {
  await requireAuth()
  await ensureSchema()
  const id = Number(formData.get('id'))

  const rows = await sql`SELECT url FROM artwork_media WHERE id = ${id}`
  await deleteBlobIfOwned((rows[0] as { url: string })?.url)

  await sql`DELETE FROM artwork_media WHERE id = ${id}`
  revalidateAll()
}

export async function reorderArtworkMedia(formData: FormData) {
  await requireAuth()
  await ensureSchema()

  const id = Number(formData.get('id'))
  const direction = String(formData.get('direction') ?? '')

  const rows = await sql`SELECT * FROM artwork_media WHERE id = ${id}`
  const current = rows[0] as { artwork_id: number; sort_order: number } | undefined
  if (!current) return

  const siblings = (await sql`
    SELECT id, sort_order FROM artwork_media
    WHERE artwork_id = ${current.artwork_id}
    ORDER BY sort_order ASC, created_at ASC
  `) as { id: number; sort_order: number }[]

  const index = siblings.findIndex((s) => s.id === id)
  const swapIndex = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || swapIndex < 0 || swapIndex >= siblings.length) return

  const neighbor = siblings[swapIndex]
  const self = siblings[index]

  await sql`UPDATE artwork_media SET sort_order = ${neighbor.sort_order} WHERE id = ${self.id}`
  await sql`UPDATE artwork_media SET sort_order = ${self.sort_order} WHERE id = ${neighbor.id}`
  revalidateAll()
}

/* ---------- Shows ---------- */

export async function createShow(formData: FormData) {
  await requireAuth()

  const title = String(formData.get('title') ?? '').trim() || 'Untitled Show'
  const venue = String(formData.get('venue') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const startDate = String(formData.get('start_date') ?? '').trim()
  const endDate = String(formData.get('end_date') ?? '').trim() || null
  const url = String(formData.get('url') ?? '').trim()

  if (!startDate) throw new Error('A start date is required')

  await sql`
    INSERT INTO shows (title, venue, location, description, start_date, end_date, url)
    VALUES (${title}, ${venue}, ${location}, ${description}, ${startDate}, ${endDate}, ${url})
  `
  revalidateAll()
}

export async function updateShow(formData: FormData) {
  await requireAuth()

  const id = Number(formData.get('id'))
  const title = String(formData.get('title') ?? '').trim() || 'Untitled Show'
  const venue = String(formData.get('venue') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const startDate = String(formData.get('start_date') ?? '').trim()
  const endDate = String(formData.get('end_date') ?? '').trim() || null
  const url = String(formData.get('url') ?? '').trim()

  await sql`
    UPDATE shows
    SET title = ${title}, venue = ${venue}, location = ${location},
        description = ${description}, start_date = ${startDate},
        end_date = ${endDate}, url = ${url}
    WHERE id = ${id}
  `
  revalidateAll()
}

export async function deleteShow(formData: FormData) {
  await requireAuth()
  const id = Number(formData.get('id'))
  await sql`DELETE FROM shows WHERE id = ${id}`
  revalidateAll()
}

/* ---------- Homepage / about photos ---------- */

const PHOTO_KEYS = ['hero_image', 'about_image'] as const

export async function updateLunaPhoto(formData: FormData) {
  await requireAuth()

  const key = String(formData.get('key') ?? '')
  if (!PHOTO_KEYS.includes(key as (typeof PHOTO_KEYS)[number])) {
    throw new Error('Invalid photo slot')
  }

  const imageUrl = String(formData.get('image_url') ?? '').trim()
  if (!imageUrl) {
    throw new Error('Please choose a photo to upload')
  }

  // Remove the previous uploaded photo (skip the bundled starter images).
  const existing = await sql`SELECT value FROM site_content WHERE key = ${key}`
  const oldUrl = (existing[0] as { value: string })?.value
  await deleteBlobIfOwned(oldUrl)

  await sql`
    INSERT INTO site_content (key, value, updated_at)
    VALUES (${key}, ${imageUrl}, now())
    ON CONFLICT (key) DO UPDATE SET value = ${imageUrl}, updated_at = now()
  `
  revalidateAll()
}

/* ---------- Site content ---------- */

export async function updateContent(formData: FormData) {
  await requireAuth()

  const entries: [string, string][] = []
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') entries.push([key, value])
  }

  for (const [key, value] of entries) {
    await sql`
      INSERT INTO site_content (key, value, updated_at)
      VALUES (${key}, ${value}, now())
      ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = now()
    `
  }
  revalidateAll()
}
