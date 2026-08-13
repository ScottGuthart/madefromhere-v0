import Image from 'next/image'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getSiteContent } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'About — From Here Studio',
  description: 'Meet Jackie, the artist behind From Here Studio.',
}

export default async function AboutPage() {
  const content = await getSiteContent()
  const title = content.about_title ?? 'Meet Jackie'
  const body = content.about_body ?? ''
  const paragraphs = body.split('\n').filter((p) => p.trim().length > 0)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          <div className="relative aspect-4/5 overflow-hidden bg-muted md:sticky md:top-24 md:self-start">
            <Image
              src={content.about_image ?? '/luna/about.png'}
              alt="Jackie in her studio"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
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
