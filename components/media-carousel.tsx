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
  // gallery) used to fully preload all of its videos the instant the page
  // loaded — on a page with many pieces that's dozens of large videos
  // decoding at once, which exceeds mobile browsers' concurrent-video
  // limits and makes some of them fail outright (a black box with a
  // disabled play button — not just slow, actually broken). Only start
  // preloading once this carousel is about to be on screen instead, with
  // enough lead distance that it's still ready before you scroll to it.
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
      {/* Every slide is mounted from the start (not just the active one) so
       * videos begin fetching as soon as this carousel is primed, instead
       * of only once someone swipes to them. All videos preload in full
       * (`preload="auto"`), not just the active slide — a lighter
       * "metadata" preload often doesn't paint a visible first frame at all
       * in some browsers, which is why an inactive video slide could look
       * like a blank box instead of a thumbnail until it was played. */}
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
              src={primed ? item.url : undefined}
              controls={i === index}
              playsInline
              muted
              preload={primed ? 'auto' : 'none'}
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
