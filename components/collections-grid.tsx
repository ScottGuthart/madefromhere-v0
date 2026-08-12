import Link from 'next/link'
import { MediaCarousel, type MediaItem } from '@/components/media-carousel'
import type { Collection } from '@/lib/types'

export function CollectionsGrid({
  collections,
  slidesByCollection,
}: {
  collections: Collection[]
  slidesByCollection: Record<number, MediaItem[]>
}) {
  if (collections.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((c) => {
        const slides = slidesByCollection[c.id]
        return (
          <div key={c.id} className="group">
            <MediaCarousel
              items={
                slides && slides.length > 0
                  ? slides
                  : [{ type: 'image', url: c.cover_image_url }]
              }
              alt={c.title}
              className="aspect-4/5"
              imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <Link href={`/gallery/${c.id}`} className="mt-3 block">
              <h3 className="font-serif text-lg leading-tight transition-colors group-hover:text-accent">
                {c.title}
              </h3>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {c.description}
                </p>
              )}
              <span className="mt-1 inline-block text-xs uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-accent">
                View this place &rarr;
              </span>
            </Link>
          </div>
        )
      })}
    </div>
  )
}
