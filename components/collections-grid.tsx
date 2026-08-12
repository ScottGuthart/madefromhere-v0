import Image from 'next/image'
import Link from 'next/link'
import type { Collection } from '@/lib/types'

export function CollectionsGrid({ collections }: { collections: Collection[] }) {
  if (collections.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((c) => (
        <Link key={c.id} href={`/gallery/${c.id}`} className="group block">
          <div className="relative aspect-4/5 overflow-hidden bg-muted">
            <Image
              src={c.cover_image_url || '/placeholder.svg'}
              alt={c.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          </div>
          <h3 className="mt-3 font-serif text-lg leading-tight">{c.title}</h3>
          {c.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {c.description}
            </p>
          )}
        </Link>
      ))}
    </div>
  )
}
