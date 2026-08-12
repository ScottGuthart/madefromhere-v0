import type { MediaItem } from '@/components/media-carousel'
import type { Artwork, ArtworkMedia } from '@/lib/types'

// A piece's own photo first, then any supplemental photos/videos (process
// shots, timelapses) in order — the sequence shown in its carousel anywhere
// it appears on the site.
export function slidesForArtwork(art: Artwork, media: ArtworkMedia[] | undefined): MediaItem[] {
  const extra: MediaItem[] = (media ?? []).map((m) => ({ type: m.media_type, url: m.url }))
  return [{ type: 'image', url: art.image_url }, ...extra]
}
