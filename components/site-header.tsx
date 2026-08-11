'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Home' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/shows', label: 'Shows' },
  { href: '/about', label: 'About' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link
          href="/"
          className="flex flex-col leading-none"
          onClick={() => setOpen(false)}
          aria-label="From Here Studio — home"
        >
          <span className="font-serif text-2xl tracking-tight">from here</span>
          <span className="mt-1 text-[0.65rem] uppercase tracking-[0.4em] text-muted-foreground">
            studio
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const active =
              link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm tracking-wide transition-colors hover:text-foreground',
                  active ? 'text-foreground paint-underline' : 'text-muted-foreground',
                )}
              >
                {link.label}
              </Link>
            )
          })}
          <Link
            href="/studio"
            className="text-sm tracking-wide text-muted-foreground/70 transition-colors hover:text-accent"
          >
            Studio
          </Link>
        </nav>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-5 py-3 md:hidden">
          {[...links, { href: '/studio', label: 'Studio' }].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-2 text-sm tracking-wide text-muted-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
