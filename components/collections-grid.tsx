import { PlaceCard } from '@/components/place-card'
import type { MediaItem } from '@/components/media-carousel'
import type { Collection } from '@/lib/types'

export function CollectionsGrid({
  collections,
  slidesByCollection,
  pieceCountByCollection = {},
}: {
  collections: Collection[]
  slidesByCollection: Record<number, MediaItem[]>
  pieceCountByCollection?: Record<number, number>
}) {
  if (collections.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((c) => (
        <PlaceCard
          key={c.id}
          collection={c}
          slides={slidesByCollection[c.id] ?? []}
          pieceCount={pieceCountByCollection[c.id] ?? 0}
        />
      ))}
    </div>
  )
}
