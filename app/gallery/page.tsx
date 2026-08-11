import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { GalleryGrid } from '@/components/gallery-grid'
import { getArtworks, getSiteContent } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Gallery — From Here Studio',
  description: 'Browse original art — paintings, pottery, and more — by Luna the cat.',
}

export default async function GalleryPage() {
  const [artworks, content] = await Promise.all([getArtworks(), getSiteContent()])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-14 md:px-8 md:py-20">
        <header className="mb-12 max-w-2xl">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">
            The collection
          </p>
          <h1 className="text-balance font-serif text-4xl font-semibold tracking-tight md:text-6xl">
            Gallery
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Every piece is one of a kind &mdash; paintings, pottery, and more.
            Tap any work to see details and inquire about availability.
          </p>
        </header>
        <GalleryGrid artworks={artworks} />
      </main>
      <SiteFooter email={content.contact_email} />
    </div>
  )
}
