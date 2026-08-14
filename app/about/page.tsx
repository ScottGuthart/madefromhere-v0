import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { MediaCarousel, type MediaItem } from '@/components/media-carousel'
import { getAboutPhotos, getSiteContent } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'About — Made From Here',
  description: 'Meet Jackie, the artist behind Made From Here.',
}

export default async function AboutPage() {
  const [content, aboutPhotos] = await Promise.all([getSiteContent(), getAboutPhotos()])
  const title = content.about_title ?? 'Meet Jackie'
  const body = content.about_body ?? ''
  const paragraphs = body.split('\n').filter((p) => p.trim().length > 0)

  // Falls back to the old single about_image (or the bundled starter photo)
  // until any photos are added through the new carousel manager.
  const slides: MediaItem[] =
    aboutPhotos.length > 0
      ? aboutPhotos.map((p) => ({ type: p.media_type, url: p.url }))
      : [{ type: 'image', url: content.about_image ?? '/luna/about.png' }]

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          <MediaCarousel
            items={slides}
            alt="Jackie in her studio"
            className="aspect-4/5 overflow-hidden bg-muted md:sticky md:top-24 md:self-start"
            imageSizes="(max-width: 768px) 100vw, 50vw"
          />
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">
              The artist
            </p>
            <h1 className="text-balance font-serif text-4xl font-semibold tracking-tight md:text-6xl">
              {title}
            </h1>
            <div className="mt-6 space-y-5 text-pretty text-lg leading-relaxed text-foreground/80">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter email={content.contact_email} />
    </div>
  )
}
