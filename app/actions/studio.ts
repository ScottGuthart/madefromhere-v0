'use server'

import { put, del } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import { sql } from '@/lib/db'
import { ensureSchema } from '@/lib/schema'
import { isAuthenticated } from '@/lib/auth'

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

/* ---------- Collections ---------- */

export async function createCollection(formData: FormData) {
  await requireAuth()
  await ensureSchema()

  const title = String(formData.get('title') ?? '').trim() || 'Untitled place'
  const description = String(formData.get('description') ?? '').trim()

  const file = formData.get('cover_image') as File | null
  let coverUrl = String(formData.get('cover_image_url') ?? '').trim()
  if (file && file.size > 0) {
    const blob = await put(`collections/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })
    coverUrl = blob.url
  }

  const maxRows = await sql`SELECT COALESCE(MAX(sort_order), 0) AS max FROM collections`
  const sortOrder = Number((maxRows[0] as { max: number }).max) + 1

  await sql`
    INSERT INTO collections (title, description, cover_image_url, sort_order)
    VALUES (${title}, ${description}, ${coverUrl}, ${sortOrder})
  `
  revalidateAll()
}

export async function updateCollection(formData: FormData) {
  await requireAuth()
  await ensureSchema()

  const id = Number(formData.get('id'))
  const title = String(formData.get('title') ?? '').trim() || 'Untitled place'
  const description = String(formData.get('description') ?? '').trim()

  const file = formData.get('cover_image') as File | null
  if (file && file.size > 0) {
    const blob = await put(`collections/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })
    const rows = await sql`SELECT cover_image_url FROM collections WHERE id = ${id}`
    await deleteBlobIfOwned((rows[0] as { cover_image_url: string })?.cover_image_url)

    await sql`
      UPDATE collections
      SET title = ${title}, description = ${description}, cover_image_url = ${blob.url}
      WHERE id = ${id}
    `
  } else {
    await sql`
      UPDATE collections
      SET title = ${title}, description = ${description}
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

  const file = formData.get('image') as File | null
  let imageUrl = String(formData.get('image_url') ?? '').trim()

  if (file && file.size > 0) {
    const blob = await put(`artworks/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })
    imageUrl = blob.url
  }

  if (!imageUrl) {
    throw new Error('An image is required')
  }

  const title = String(formData.get('title') ?? '').trim() || 'Untitled'
  const description = String(formData.get('description') ?? '').trim()
  const medium = String(formData.get('medium') ?? '').trim()
  const year = String(formData.get('year') ?? '').trim()
  const status = String(formData.get('status') ?? 'available')
  const collectionRaw = String(formData.get('collection_id') ?? '').trim()
  const collectionId = collectionRaw ? Number(collectionRaw) : null

  const maxRows = await sql`SELECT COALESCE(MAX(sort_order), 0) AS max FROM artworks`
  const sortOrder = Number((maxRows[0] as { max: number }).max) + 1

  await sql`
    INSERT INTO artworks (title, description, image_url, medium, year, status, sort_order, collection_id)
    VALUES (${title}, ${description}, ${imageUrl}, ${medium}, ${year}, ${status}, ${sortOrder}, ${collectionId})
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
  const status = String(formData.get('status') ?? 'available')
  const collectionRaw = String(formData.get('collection_id') ?? '').trim()
  const collectionId = collectionRaw ? Number(collectionRaw) : null

  await sql`
    UPDATE artworks
    SET title = ${title}, description = ${description}, medium = ${medium},
        year = ${year}, status = ${status}, collection_id = ${collectionId}
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

/* ---------- Artwork media (carousel photos/videos) ---------- */

export async function addArtworkMedia(formData: FormData) {
  await requireAuth()
  await ensureSchema()

  const artworkId = Number(formData.get('artwork_id'))
  const files = formData.getAll('media').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) {
    throw new Error('Choose at least one photo or video')
  }

  const maxRows = await sql`
    SELECT COALESCE(MAX(sort_order), 0) AS max FROM artwork_media WHERE artwork_id = ${artworkId}
  `
  let nextOrder = Number((maxRows[0] as { max: number }).max) + 1

  for (const file of files) {
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
    const blob = await put(`artwork-media/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })
    await sql`
      INSERT INTO artwork_media (artwork_id, media_type, url, sort_order)
      VALUES (${artworkId}, ${mediaType}, ${blob.url}, ${nextOrder})
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

/* ---------- Luna photos ---------- */

const PHOTO_KEYS = ['hero_image', 'about_image'] as const

export async function updateLunaPhoto(formData: FormData) {
  await requireAuth()

  const key = String(formData.get('key') ?? '')
  if (!PHOTO_KEYS.includes(key as (typeof PHOTO_KEYS)[number])) {
    throw new Error('Invalid photo slot')
  }

  const file = formData.get('image') as File | null
  if (!file || file.size === 0) {
    throw new Error('Please choose a photo to upload')
  }

  const blob = await put(`luna/${key}-${Date.now()}-${file.name}`, file, {
    access: 'public',
  })

  // Remove the previous uploaded photo (skip the bundled starter images).
  const existing = await sql`SELECT value FROM site_content WHERE key = ${key}`
  const oldUrl = (existing[0] as { value: string })?.value
  await deleteBlobIfOwned(oldUrl)

  await sql`
    INSERT INTO site_content (key, value, updated_at)
    VALUES (${key}, ${blob.url}, now())
    ON CONFLICT (key) DO UPDATE SET value = ${blob.url}, updated_at = now()
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
