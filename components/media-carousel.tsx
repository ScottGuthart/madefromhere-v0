'use client'

import { useState } from 'react'
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
}: {
  items: MediaItem[]
  alt: string
  className?: string
  imageSizes?: string
}) {
  const [index, setIndex] = useState(0)
  const safeItems = items.length > 0 ? items : [{ type: 'image' as const, url: '' }]

  function go(delta: number) {
    setIndex((i) => (i + delta + safeItems.length) % safeItems.length)
  }

  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {/* Every slide is mounted from the start (not just the active one) so
       * videos begin fetching as soon as the carousel is on the page,
       * instead of only once someone swipes to them. The active slide gets
       * `preload="auto"` to fully buffer; the rest get the much lighter
       * "metadata" so they're not downloading in full for no reason. */}
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
              preload={i === index ? 'auto' : 'metadata'}
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src={item.url || '/placeholder.svg'}
              alt={alt}
              fill
              sizes={imageSizes}
              priority={i === index}
              className="object-cover"
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
