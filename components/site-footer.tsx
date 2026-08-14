import Link from 'next/link'
import { ObfuscatedEmail } from '@/components/obfuscated-email'
import { splitEmail } from '@/lib/email'

export function SiteFooter({ email }: { email?: string }) {
  const parts = splitEmail(email)

  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <p className="font-serif text-2xl">made from here</p>
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground">
            Art rooted in place
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Original art rooted in place &mdash; made with pieces of where it
            began.
          </p>
        </div>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground md:items-end">
          {parts && (
            <ObfuscatedEmail
              user={parts.user}
              domain={parts.domain}
              className="transition-colors hover:text-accent"
            />
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
            &copy; {new Date().getFullYear()} Made From Here.
          </p>
        </div>
      </div>
    </footer>
  )
}
