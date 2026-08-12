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
  const current = safeItems[Math.min(index, safeItems.length - 1)]

  function go(delta: number) {
    setIndex((i) => (i + delta + safeItems.length) % safeItems.length)
  }

  return (
    <div className={cn('relative bg-muted', className)}>
      {current.type === 'video' ? (
        <video
          key={current.url}
          src={current.url}
          controls
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <Image
          key={current.url}
          src={current.url || '/placeholder.svg'}
          alt={alt}
          fill
          sizes={imageSizes}
          className="object-cover"
        />
      )}

      {safeItems.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 p-1.5 text-foreground opacity-80 transition-opacity hover:opacity-100"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 p-1.5 text-foreground opacity-80 transition-opacity hover:opacity-100"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
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
