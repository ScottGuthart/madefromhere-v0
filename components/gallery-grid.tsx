'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { MediaCarousel, type MediaItem } from '@/components/media-carousel'
import type { Artwork, ArtworkMedia } from '@/lib/types'
import { cn } from '@/lib/utils'

function slidesFor(art: Artwork, media: ArtworkMedia[] | undefined): MediaItem[] {
  const extra: MediaItem[] = (media ?? []).map((m) => ({ type: m.media_type, url: m.url }))
  return [{ type: 'image', url: art.image_url }, ...extra]
}

export function GalleryGrid({
  artworks,
  mediaByArtwork = {},
}: {
  artworks: Artwork[]
  mediaByArtwork?: Record<number, ArtworkMedia[]>
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
          <button
            key={art.id}
            type="button"
            onClick={() => setActive(art)}
            className="group text-left"
          >
            <div className="relative aspect-4/5 overflow-hidden bg-muted">
              <Image
                src={art.image_url || '/placeholder.svg'}
                alt={art.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              {art.status === 'sold' && (
                <span className="absolute left-3 top-3 bg-foreground px-2 py-1 text-[10px] uppercase tracking-widest text-background">
                  Sold
                </span>
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-lg leading-tight">{art.title}</h3>
              <span className="shrink-0 text-xs uppercase tracking-widest text-muted-foreground">
                {art.year}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{art.medium}</p>
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent
          showCloseButton
          className="max-w-4xl overflow-hidden p-0 sm:rounded-none"
        >
          {active && (
            <div className="grid gap-0 md:grid-cols-[1.4fr_1fr]">
              <MediaCarousel
                items={slidesFor(active, mediaByArtwork[active.id])}
                alt={active.title}
                className="aspect-4/5 md:aspect-auto"
              />
              <div className="flex flex-col gap-4 p-6 md:p-8">
                <div>
                  <DialogTitle className="font-serif text-2xl leading-tight">
                    {active.title}
                  </DialogTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {active.medium}
                    {active.year ? `, ${active.year}` : ''}
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
                {active.status === 'available' && (
                  <a
                    href="mailto:hello@fromherestudio.art"
                    className="mt-auto inline-flex w-fit items-center border border-foreground px-4 py-2 text-sm tracking-wide transition-colors hover:bg-foreground hover:text-background"
                  >
                    Inquire about this piece
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
