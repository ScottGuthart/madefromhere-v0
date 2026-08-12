import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { GalleryGrid } from '@/components/gallery-grid'
import { CollectionsGrid } from '@/components/collections-grid'
import type { MediaItem } from '@/components/media-carousel'
import { slidesForArtwork } from '@/lib/media'
import {
  getArtworks,
  getArtworkMediaByArtwork,
  getCollections,
  getSiteContent,
} from '@/lib/queries'
import type { Artwork, ArtworkMedia, Collection } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Gallery — From Here Studio',
  description: 'Browse original art — paintings, pottery, and more — by Luna the cat.',
}

// The place's own photo, then every piece made there (its main image, then
// its supplemental photos/videos) — so the gallery grid card can be
// browsed as one carousel without clicking into the place first.
function slidesForCollection(
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

export default async function GalleryPage() {
  const [collections, artworks, mediaMap, content] = await Promise.all([
    getCollections(),
    getArtworks(),
    getArtworkMediaByArtwork(),
    getSiteContent(),
  ])

  const unassigned = artworks.filter((a) => a.collection_id == null)
  const mediaByArtwork = Object.fromEntries(mediaMap)

  const slidesByCollection = Object.fromEntries(
    collections.map((c) => [
      c.id,
      slidesForCollection(
        c,
        artworks.filter((a) => a.collection_id === c.id),
        mediaByArtwork,
      ),
    ]),
  )

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-14 md:px-8 md:py-20">
        <header className="mb-12 max-w-2xl">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">
            The collection
          </p>
          <h1 className="text-balance font-serif text-4xl font-semibold tracking-tight md:text-6xl">
            Gallery
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Every piece begins with a place. Use the arrows to browse the
            materials gathered, the process, and the final piece made there —
            or tap through for the full story.
          </p>
        </header>

        {collections.length === 0 && unassigned.length === 0 ? (
          <p className="py-24 text-center text-muted-foreground">
            No work on display yet. Check back soon.
          </p>
        ) : (
          <>
            <CollectionsGrid collections={collections} slidesByCollection={slidesByCollection} />

            {unassigned.length > 0 && (
              <div className={collections.length > 0 ? 'mt-16' : undefined}>
                {collections.length > 0 && (
                  <h2 className="mb-8 border-b border-border pb-4 font-serif text-2xl font-semibold">
                    More work
                  </h2>
                )}
                <GalleryGrid artworks={unassigned} mediaByArtwork={mediaByArtwork} />
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter email={content.contact_email} />
    </div>
  )
}
