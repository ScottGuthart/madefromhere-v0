import Link from 'next/link'
import { MediaCarousel, type MediaItem } from '@/components/media-carousel'
import type { Collection } from '@/lib/types'

// The card used everywhere a place gets its full introduction — the
// gallery grid, and the homepage's "Recent places" — so a place looks the
// same wherever it shows up. The place detail page's own "More places to
// explore" section is intentionally lighter than this (a photo and a name,
// no story or piece count) since it's just inviting another click, not
// introducing the place from scratch.
export function PlaceCard({
  collection,
  slides,
  pieceCount = 0,
  imageSizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
}: {
  collection: Collection
  slides: MediaItem[]
  pieceCount?: number
  imageSizes?: string
}) {
  return (
    <div className="group">
      <MediaCarousel
        items={slides.length > 0 ? slides : [{ type: 'image', url: collection.cover_image_url }]}
        alt={collection.title}
        className="aspect-4/5"
        imageSizes={imageSizes}
      />
      <Link href={`/gallery/${collection.id}`} className="mt-3 block">
        <h3 className="font-serif text-lg leading-tight transition-colors group-hover:text-accent">
          {collection.title}
        </h3>
        {collection.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {collection.description}
          </p>
        )}
        <span className="mt-1 inline-block text-xs uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-accent">
          {pieceCount > 0
            ? `View ${pieceCount} piece${pieceCount === 1 ? '' : 's'} from this place →`
            : 'View this place →'}
        </span>
      </Link>
    </div>
  )
}
