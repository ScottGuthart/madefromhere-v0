import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { GalleryGrid } from '@/components/gallery-grid'
import { CollectionsGrid } from '@/components/collections-grid'
import {
  getArtworks,
  getArtworkMediaByArtwork,
  getCollections,
  getSiteContent,
} from '@/lib/queries'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Gallery — From Here Studio',
  description: 'Browse original art — paintings, pottery, and more — by Luna the cat.',
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
            Every piece begins with a place. Tap a location to see the work
            made there — the materials gathered, the process, and the final
            piece.
          </p>
        </header>

        {collections.length === 0 && unassigned.length === 0 ? (
          <p className="py-24 text-center text-muted-foreground">
            No work on display yet. Check back soon.
          </p>
        ) : (
          <>
            <CollectionsGrid collections={collections} />

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
