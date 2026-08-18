'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MediaItem = {
  type: 'image' | 'video'
  url: string
}

export function MediaCarousel({
  items,
  alt,
  className,
  imageSizes = '(max-width: 768px) 100vw, 60vw',
  fit = 'cover',
}: {
  items: MediaItem[]
  alt: string
  className?: string
  imageSizes?: string
  /** 'cover' crops to fill the box (grid tiles); 'contain' letterboxes so
   * nothing is ever cropped — use this wherever the whole photo/video
   * matters more than a tidy fixed shape, e.g. a piece's own detail view. */
  fit?: 'cover' | 'contain'
}) {
  const [index, setIndex] = useState(0)
  const safeItems = items.length > 0 ? items : [{ type: 'image' as const, url: '' }]

  // Every carousel on a page (place cards, Recent work, every piece in a
  // gallery) used to fully preload ALL of its videos — every slide, not
  // just the visible one — the instant the page loaded. On a page with
  // many pieces that's dozens of large videos fully downloading/decoding
  // at once, which exceeds mobile browsers' concurrent-video limits and
  // makes some fail outright: not slow, actually broken — a black box
  // with a disabled play button that never recovers. A first attempt at
  // gating that behind "is this carousel near the viewport" still left
  // every hidden/off-screen slide unprimed with no `src` at all, which
  // *is* that exact broken-looking black-box-disabled-button state — on
  // a grid page several carousels can be "near the viewport" at once, so
  // it reproduced the same failure, just for a smaller batch.
  //
  // The actual fix: every video slide always has a `src` and at least
  // `preload="metadata"`, so every video shows a real first frame and an
  // enabled play button immediately, everywhere, all the time — nothing
  // is ever left in the broken no-src state. The only thing gated behind
  // "is this carousel about to be on screen" is the much heavier full
  // buffering (`preload="auto"`), and even then only for the one slide
  // actually being shown — inactive slides in a multi-item carousel never
  // need a full buffer at all.
  const containerRef = useRef<HTMLDivElement>(null)
  const [primed, setPrimed] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPrimed(true)
          observer.disconnect()
        }
      },
      { rootMargin: '800px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function go(delta: number) {
    setIndex((i) => (i + delta + safeItems.length) % safeItems.length)
  }

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden bg-muted', className)}>
      {/* Every slide is mounted from the start (not just the active one),
       * and every video always has a `src` — so every slide always has a
       * real first frame and a working play button, never the broken
       * black-box-disabled-button state. The active slide gets a full
       * buffer (`preload="auto"`) once this carousel is primed, since
       * that's the one actually about to be watched; every other slide
       * only ever needs `preload="metadata"` (enough for a thumbnail, far
       * lighter than downloading a video no one's looking at yet). */}
      {safeItems.map((item, i) => (
        <div
          key={item.url + i}
          className={cn(
            'absolute inset-0 transition-opacity duration-200',
            i === index ? 'z-0 opacity-100' : 'pointer-events-none z-0 opacity-0',
          )}
          aria-hidden={i === index ? undefined : true}
        >
          {item.type === 'video' ? (
            <video
              src={item.url}
              controls={i === index}
              playsInline
              muted
              preload={primed && i === index ? 'auto' : 'metadata'}
              className={cn('h-full w-full', fit === 'contain' ? 'object-contain' : 'object-cover')}
            />
          ) : (
            <Image
              src={item.url || '/placeholder.svg'}
              alt={alt}
              fill
              sizes={imageSizes}
              priority={i === index}
              className={fit === 'contain' ? 'object-contain' : 'object-cover'}
            />
          )}
        </div>
      ))}

      {safeItems.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-background/80 p-1.5 text-foreground opacity-80 transition-opacity hover:opacity-100"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-background/80 p-1.5 text-foreground opacity-80 transition-opacity hover:opacity-100"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {safeItems.map((item, i) => (
              <button
                key={item.url + i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  'size-1.5 rounded-full transition-colors',
                  i === index ? 'bg-background' : 'bg-background/50',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
