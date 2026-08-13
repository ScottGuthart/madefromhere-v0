'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MediaCarousel } from '@/components/media-carousel'
import { slidesForArtwork } from '@/lib/media'
import type { Artwork, ArtworkMedia } from '@/lib/types'
import { cn } from '@/lib/utils'

// A horizontally scrollable row of pieces (each its own media carousel),
// with arrows to page through them — so browsing more than what fits on
// screen doesn't require leaving the page.
export function PieceRow({
  artworks,
  mediaByArtwork,
}: {
  artworks: Artwork[]
  mediaByArtwork: Record<number, ArtworkMedia[]>
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateArrows()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [updateArrows])

  function scrollByPage(direction: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  if (artworks.length === 0) return null

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {artworks.map((art) => (
          <div
            key={art.id}
            className="group w-[78%] shrink-0 snap-start sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
          >
            <MediaCarousel
              items={slidesForArtwork(art, mediaByArtwork[art.id])}
              alt={art.title}
              className="aspect-4/5"
              imageSizes="(max-width: 640px) 78vw, (max-width: 1024px) 50vw, 33vw"
            />
            <Link
              href={art.collection_id ? `/gallery/${art.collection_id}` : '/gallery'}
              className="mt-3 block"
            >
              <h3 className="font-serif text-lg transition-colors group-hover:text-accent">
                {art.title}
              </h3>
              <p className="text-sm text-muted-foreground">{art.medium}</p>
            </Link>
          </div>
        ))}
      </div>

      {(canScrollLeft || canScrollRight) && (
        <>
          <button
            type="button"
            aria-label="Scroll to previous pieces"
            onClick={() => scrollByPage(-1)}
            disabled={!canScrollLeft}
            className={cn(
              'absolute -left-4 top-[38%] hidden -translate-y-1/2 bg-background p-2 text-foreground shadow-md ring-1 ring-border transition-opacity md:block',
              canScrollLeft ? 'opacity-100 hover:opacity-80' : 'pointer-events-none opacity-0',
            )}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Scroll to more pieces"
            onClick={() => scrollByPage(1)}
            disabled={!canScrollRight}
            className={cn(
              'absolute -right-4 top-[38%] hidden -translate-y-1/2 bg-background p-2 text-foreground shadow-md ring-1 ring-border transition-opacity md:block',
              canScrollRight ? 'opacity-100 hover:opacity-80' : 'pointer-events-none opacity-0',
            )}
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </div>
  )
}
