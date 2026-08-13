// Pulls a lat/lng pair out of a normal Google Maps URL (the kind you get
// from the Share button — "https://maps.google.com/maps?q=..." or
// ".../@47.8,-121.9,15z..." or a place link with "!3d...!4d..."). Doesn't
// need any Google API — it's just parsing the URL a person pasted in.
// Returns null if the format isn't one we recognize (e.g. a shortened
// goo.gl link, which can't be resolved without a server round trip).
export function parseGoogleMapsUrl(input: string): { lat: number; lng: number } | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // .../@47.8123,-121.9456,15z
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // ?q=47.8123,-121.9456
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // place-detail !3d...!4d...
    /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/, // a bare "lat,lng" pasted directly
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) {
      const lat = Number(match[1])
      const lng = Number(match[2])
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
    }
  }
  return null
}

// A keyless embeddable map (no Google API key / billing account needed).
export function mapEmbedUrl(lat: number, lng: number): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`
}

export function mapLinkUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

// Same keyless embed, but by a place name instead of coordinates — for when
// someone pasted a shortened Google Maps link (maps.app.goo.gl/...), which
// can't be resolved to coordinates client-side. Google's embed will search
// for and center on the name itself, so this still gives a real preview
// instead of just a bare link.
export function mapEmbedUrlForQuery(query: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=13&output=embed`
}
