// Splits an address into its two halves so a server component can pass them
// to a client component as separate props. That matters: Next.js embeds
// every prop crossing the server→client boundary into the page's initial
// HTML (the RSC payload), even if it's never rendered as visible text — so
// passing the whole address as one prop would still leave it sitting in the
// page source for a scraper to regex out. Two disconnected strings aren't a
// match for an email-shaped pattern; only <ObfuscatedEmail>'s own
// client-side code reassembles them, after the page has already loaded.
export function splitEmail(email?: string | null): { user: string; domain: string } | null {
  if (!email) return null
  const at = email.indexOf('@')
  if (at <= 0 || at === email.length - 1) return null
  return { user: email.slice(0, at), domain: email.slice(at + 1) }
}
