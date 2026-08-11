import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getArtworks, getShows, getSiteContent } from '@/lib/queries'
import { formatShowDate, isUpcoming } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [artworks, shows, content] = await Promise.all([
    getArtworks(),
    getShows(),
    getSiteContent(),
  ])

  const featured = artworks.slice(0, 3)
  const upcoming = shows.filter((s) => isUpcoming(s.start_date, s.end_date))[0]

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:gap-12 md:px-8 md:py-20">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.3em] text-accent">
              Est. 2022 &middot; Working Artist
            </p>
            <h1 className="text-balance font-serif text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
              {content.hero_tagline ?? 'Made From Here'}
            </h1>
            <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              Luna turns her feelings into art &mdash; paintings, pottery, and
              more. The thrill of the red dot, the patience of waiting for
              dinner, the deep peace of an afternoon nap in the sun.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 bg-foreground px-6 py-3 text-sm tracking-wide text-background transition-opacity hover:opacity-90"
              >
                View the gallery
                <ArrowUpRight className="size-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center px-6 py-3 text-sm tracking-wide text-foreground underline-offset-4 hover:underline"
              >
                Meet Luna
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-4/5 overflow-hidden bg-muted">
              <Image
                src={content.hero_image ?? '/luna/hero.png'}
                alt="Luna the cat in her art studio with paint on her paws"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden bg-accent px-4 py-3 text-accent-foreground md:block">
              <p className="font-serif text-xl leading-none">Luna</p>
              <p className="text-[11px] uppercase tracking-widest">the artist</p>
            </div>
          </div>
        </section>

        {/* Featured works */}
        <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-16">
          <div className="mb-8 flex items-end justify-between border-b border-border pb-4">
            <h2 className="font-serif text-3xl font-semibold md:text-4xl">
              Recent work
            </h2>
            <Link
              href="/gallery"
              className="text-sm tracking-wide text-muted-foreground transition-colors hover:text-accent"
            >
              See all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-3">
            {featured.map((art) => (
              <Link key={art.id} href="/gallery" className="group">
                <div className="relative aspect-4/5 overflow-hidden bg-muted">
                  <Image
                    src={art.image_url || '/placeholder.svg'}
                    alt={art.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <h3 className="mt-3 font-serif text-lg">{art.title}</h3>
                <p className="text-sm text-muted-foreground">{art.medium}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Upcoming show banner */}
        {upcoming && (
          <section className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="flex flex-col gap-4 bg-foreground px-6 py-8 text-background md:flex-row md:items-center md:justify-between md:px-10">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-background/60">
                  Next show
                </p>
                <p className="mt-2 font-serif text-2xl md:text-3xl">
                  {upcoming.title}
                </p>
                <p className="mt-1 text-sm text-background/70">
                  {[upcoming.venue, upcoming.location].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex flex-col gap-2 md:items-end">
                <p className="font-serif text-lg">
                  {formatShowDate(upcoming.start_date, upcoming.end_date)}
                </p>
                <Link
                  href="/shows"
                  className="text-sm tracking-wide text-background/80 underline-offset-4 hover:underline"
                >
                  All upcoming shows &rarr;
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter email={content.contact_email} />
    </div>
  )
}
