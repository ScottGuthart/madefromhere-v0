import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getShows, getSiteContent } from '@/lib/queries'
import { formatShowDate, isUpcoming } from '@/lib/format'
import type { Show } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Shows — Luna Paints',
  description: 'Upcoming and past exhibitions featuring Luna the cat.',
}

function ShowRow({ show, past = false }: { show: Show; past?: boolean }) {
  return (
    <article className="grid gap-4 border-b border-border py-8 md:grid-cols-[200px_1fr] md:gap-8">
      <div className="text-sm">
        <p className="font-serif text-lg leading-tight text-foreground">
          {formatShowDate(show.start_date, show.end_date)}
        </p>
        {past && (
          <span className="mt-1 inline-block text-xs uppercase tracking-widest text-muted-foreground">
            Past
          </span>
        )}
      </div>
      <div>
        <h3 className="font-serif text-2xl leading-tight">{show.title}</h3>
        {(show.venue || show.location) && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {[show.venue, show.location].filter(Boolean).join(' · ')}
          </p>
        )}
        {show.description && (
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-foreground/80">
            {show.description}
          </p>
        )}
        {show.url && (
          <a
            href={show.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm tracking-wide text-accent underline-offset-4 hover:underline"
          >
            Details <ArrowUpRight className="size-3.5" />
          </a>
        )}
      </div>
    </article>
  )
}

export default async function ShowsPage() {
  const [shows, content] = await Promise.all([getShows(), getSiteContent()])

  const upcoming = shows.filter((s) => isUpcoming(s.start_date, s.end_date))
  const past = shows
    .filter((s) => !isUpcoming(s.start_date, s.end_date))
    .reverse()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-14 md:px-8 md:py-20">
        <header className="mb-12 max-w-2xl">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">
            Exhibitions &amp; events
          </p>
          <h1 className="text-balance font-serif text-4xl font-semibold tracking-tight md:text-6xl">
            Shows
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Where to see Luna&apos;s work in person. Come say hi &mdash; she
            loves a good crowd.
          </p>
        </header>

        {upcoming.length === 0 && past.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            No shows on the calendar just yet.
          </p>
        )}

        {upcoming.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Upcoming
            </h2>
            {upcoming.map((show) => (
              <ShowRow key={show.id} show={show} />
            ))}
          </section>
        )}

        {past.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Past
            </h2>
            {past.map((show) => (
              <ShowRow key={show.id} show={show} past />
            ))}
          </section>
        )}
      </main>
      <SiteFooter email={content.contact_email} />
    </div>
  )
}
