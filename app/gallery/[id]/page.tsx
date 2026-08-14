import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { GalleryGrid } from '@/components/gallery-grid'
import { mapEmbedUrl, mapEmbedUrlForQuery, mapLinkUrl } from '@/lib/geo'
import { splitEmail } from '@/lib/email'
import {
  getArtworks,
  getArtworkMediaByArtwork,
  getCollection,
  getSiteContent,
} from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const collection = await getCollection(Number(id))
  return {
    title: collection ? `${collection.title} — Made From Here` : 'Gallery — Made From Here',
  }
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const collectionId = Number(id)
  if (!Number.isFinite(collectionId)) notFound()

  const [collection, artworks, mediaMap, content] = await Promise.all([
    getCollection(collectionId),
    getArtworks(),
    getArtworkMediaByArtwork(),
    getSiteContent(),
  ])

  if (!collection) notFound()

  const pieces = artworks.filter((a) => a.collection_id === collectionId)
  const mediaByArtwork = Object.fromEntries(mediaMap)
  const contact = splitEmail(content.contact_email)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-14 md:px-8 md:py-20">
        <Link
          href="/gallery"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-4" />
          All locations
        </Link>

        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          <div className="relative aspect-4/5 overflow-hidden bg-muted md:sticky md:top-24 md:self-start">
            <Image
              src={collection.cover_image_url || '/placeholder.svg'}
              alt={collection.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">
              The place
            </p>
            <h1 className="text-balance font-serif text-4xl font-semibold tracking-tight md:text-6xl">
              {collection.title}
            </h1>
            {collection.description && (
              <p className="mt-6 text-pretty text-lg leading-relaxed text-foreground/80">
                {collection.description}
              </p>
            )}

            {(() => {
              const hasCoords = collection.latitude != null && collection.longitude != null
              if (!hasCoords && !collection.map_url) return null

              const embedSrc = hasCoords
                ? mapEmbedUrl(collection.latitude as number, collection.longitude as number)
                : mapEmbedUrlForQuery(collection.title)
              const linkHref =
                collection.map_url ||
                (hasCoords ? mapLinkUrl(collection.latitude as number, collection.longitude as number) : '')

              return (
                <div className="mt-8">
                  <p className="mb-3 text-xs uppercase tracking-[0.3em] text-accent">
                    Where this was made
                  </p>
                  <div className="aspect-4/3 overflow-hidden border border-border">
                    <iframe
                      src={embedSrc}
                      className="h-full w-full"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map showing ${collection.title}`}
                    />
                  </div>
                  {linkHref && (
                    <a
                      href={linkHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-accent"
                    >
                      Open in Google Maps
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  )}
                </div>
              )
            })()}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="mb-8 border-b border-border pb-4 font-serif text-2xl font-semibold">
            {pieces.length} piece{pieces.length === 1 ? '' : 's'} from here
          </h2>
          <GalleryGrid
            artworks={pieces}
            mediaByArtwork={mediaByArtwork}
            contactUser={contact?.user}
            contactDomain={contact?.domain}
          />
        </div>
      </main>
      <SiteFooter email={content.contact_email} />
    </div>
  )
}
