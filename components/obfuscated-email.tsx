'use client'

import { useEffect, useState } from 'react'

// Takes the address pre-split into `user`/`domain` (see lib/email.ts for
// why) and only joins them back together once this runs in the browser —
// so a bot that just fetches the page's HTML (most spam scrapers) never
// sees a complete address to harvest, while real visitors get a normal
// working mailto link a moment after the page loads.
export function ObfuscatedEmail({
  user,
  domain,
  className,
  label,
}: {
  user: string
  domain: string
  className?: string
  label?: string
}) {
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    setAddress(`${user}@${domain}`)
  }, [user, domain])

  if (!address) {
    return <span className={className}>{label ?? 'Email us'}</span>
  }

  return (
    <a href={`mailto:${address}`} className={className}>
      {label ?? address}
    </a>
  )
}
