'use server'

import { put, del } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import { sql } from '@/lib/db'
import { isAuthenticated } from '@/lib/auth'

async function requireAuth() {
  if (!(await isAuthenticated())) {
    throw new Error('Unauthorized')
  }
}

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/gallery')
  revalidatePath('/shows')
  revalidatePath('/about')
  revalidatePath('/studio')
}

/* ---------- Artworks ---------- */

export async function createArtwork(formData: FormData) {
  await requireAuth()

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

  const maxRows = await sql`SELECT COALESCE(MAX(sort_order), 0) AS max FROM artworks`
  const sortOrder = Number((maxRows[0] as { max: number }).max) + 1

  await sql`
    INSERT INTO artworks (title, description, image_url, medium, year, status, sort_order)
    VALUES (${title}, ${description}, ${imageUrl}, ${medium}, ${year}, ${status}, ${sortOrder})
  `
  revalidateAll()
}

export async function updateArtwork(formData: FormData) {
  await requireAuth()

  const id = Number(formData.get('id'))
  const title = String(formData.get('title') ?? '').trim() || 'Untitled'
  const description = String(formData.get('description') ?? '').trim()
  const medium = String(formData.get('medium') ?? '').trim()
  const year = String(formData.get('year') ?? '').trim()
  const status = String(formData.get('status') ?? 'available')

  await sql`
    UPDATE artworks
    SET title = ${title}, description = ${description}, medium = ${medium},
        year = ${year}, status = ${status}
    WHERE id = ${id}
  `
  revalidateAll()
}

export async function deleteArtwork(formData: FormData) {
  await requireAuth()
  const id = Number(formData.get('id'))

  const rows = await sql`SELECT image_url FROM artworks WHERE id = ${id}`
  const url = (rows[0] as { image_url: string })?.image_url
  if (url && url.includes('blob.vercel-storage.com')) {
    try {
      await del(url)
    } catch {
      // ignore blob deletion failures
    }
  }

  await sql`DELETE FROM artworks WHERE id = ${id}`
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
