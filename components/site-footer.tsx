import Link from 'next/link'

export function SiteFooter({ email }: { email?: string }) {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <p className="font-serif text-2xl font-semibold">Luna Paints</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Original art &mdash; paintings, pottery, and more &mdash; by a cat
            with a lot of feelings and a little bit of paint on her nose.
          </p>
        </div>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground md:items-end">
          {email && (
            <a href={`mailto:${email}`} className="transition-colors hover:text-accent">
              {email}
            </a>
          )}
          <div className="mt-2 flex gap-4">
            <Link href="/gallery" className="transition-colors hover:text-foreground">
              Gallery
            </Link>
            <Link href="/shows" className="transition-colors hover:text-foreground">
              Shows
            </Link>
            <Link href="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/70">
            &copy; {new Date().getFullYear()} Luna Paints. Good cat.
          </p>
        </div>
      </div>
    </footer>
  )
}
