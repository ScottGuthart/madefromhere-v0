import type { MediaItem } from '@/components/media-carousel'
import type { Artwork, ArtworkMedia, Collection } from '@/lib/types'

// A piece's own photo first, then any supplemental photos/videos (process
// shots, timelapses) in order — the sequence shown in its carousel anywhere
// it appears on the site.
export function slidesForArtwork(art: Artwork, media: ArtworkMedia[] | undefined): MediaItem[] {
  const extra: MediaItem[] = (media ?? []).map((m) => ({
    type: m.media_type,
    url: m.url,
    thumbnailUrl: m.thumbnail_url ?? undefined,
  }))
  return [{ type: 'image', url: art.image_url }, ...extra]
}

// The place's own photo, then every piece made there (its main image, then
// its supplemental photos/videos) — so a place card can be browsed as one
// carousel without clicking into the place first. Shared by the gallery
// page's full grid and the homepage's "Recent places" preview.
export function slidesForCollection(
  collection: Collection,
  pieces: Artwork[],
  mediaByArtwork: Record<number, ArtworkMedia[]>,
): MediaItem[] {
  const slides: MediaItem[] = []
  if (collection.cover_image_url) {
    slides.push({ type: 'image', url: collection.cover_image_url })
  }
  for (const piece of pieces) {
    slides.push(...slidesForArtwork(piece, mediaByArtwork[piece.id]))
  }
  return slides
}
