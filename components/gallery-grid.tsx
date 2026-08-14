'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { MediaCarousel } from '@/components/media-carousel'
import { ObfuscatedEmail } from '@/components/obfuscated-email'
import { slidesForArtwork } from '@/lib/media'
import { formatPieceDate } from '@/lib/format'
import type { Artwork, ArtworkMedia } from '@/lib/types'
import { cn } from '@/lib/utils'

export function GalleryGrid({
  artworks,
  mediaByArtwork = {},
  contactUser,
  contactDomain,
}: {
  artworks: Artwork[]
  mediaByArtwork?: Record<number, ArtworkMedia[]>
  // Passed pre-split rather than as one "contact@domain" prop — see
  // lib/email.ts for why that matters for keeping it out of scrapers' reach.
  contactUser?: string
  contactDomain?: string
}) {
  const [active, setActive] = useState<Artwork | null>(null)

  if (artworks.length === 0) {
    return (
      <p className="py-24 text-center text-muted-foreground">
        No work on display yet. Check back soon.
      </p>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {artworks.map((art) => (
          <div key={art.id} className="group">
            <div className="relative">
              <MediaCarousel
                items={slidesForArtwork(art, mediaByArtwork[art.id])}
                alt={art.title}
                className="aspect-4/5"
              />
              {art.status === 'sold' && (
                <span className="pointer-events-none absolute left-3 top-3 z-20 bg-foreground px-2 py-1 text-[10px] uppercase tracking-widest text-background">
                  Sold
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActive(art)}
              className="mt-3 block w-full text-left"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-lg leading-tight transition-colors group-hover:text-accent">
                  {art.title}
                </h3>
                <span className="shrink-0 text-xs uppercase tracking-widest text-muted-foreground">
                  {formatPieceDate(art.created_date, art.year)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{art.medium}</p>
            </button>
          </div>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent
          showCloseButton
          className="max-h-[90vh] max-w-2xl overflow-x-hidden overflow-y-auto p-0 sm:rounded-none"
        >
          {active && (
            <div className="flex flex-col">
              {/* "contain" so the full photo/video is always visible —
               * nothing gets cropped to force a fixed shape, matching
               * whatever it was actually shot as (portrait or landscape). */}
              <MediaCarousel
                items={slidesForArtwork(active, mediaByArtwork[active.id])}
                alt={active.title}
                className="h-[45vh] sm:h-[55vh]"
                fit="contain"
              />
              <div className="flex flex-col gap-4 p-6 md:p-8">
                <div>
                  <DialogTitle className="font-serif text-2xl leading-tight">
                    {active.title}
                  </DialogTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[active.medium, formatPieceDate(active.created_date, active.year)]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
                <span
                  className={cn(
                    'w-fit px-2.5 py-1 text-[11px] uppercase tracking-widest',
                    active.status === 'sold'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-accent text-accent-foreground',
                  )}
                >
                  {active.status === 'sold' ? 'Sold' : 'Available'}
                </span>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {active.description}
                </p>
                {active.status === 'available' && contactUser && contactDomain && (
                  <ObfuscatedEmail
                    user={contactUser}
                    domain={contactDomain}
                    label="Inquire about this piece"
                    className="inline-flex w-fit items-center border border-foreground px-4 py-2 text-sm tracking-wide transition-colors hover:bg-foreground hover:text-background"
                  />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
