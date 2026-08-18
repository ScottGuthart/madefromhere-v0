import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getSiteContent } from '@/lib/queries'

// Needs Node (not Edge) for node:fs — used to embed the bundled fallback
// logo as a data URI when nothing's been uploaded through the Studio yet.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const alt = 'Made From Here — Art Rooted in Place'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Site's actual palette (defined as oklch() in globals.css, which the
// image renderer can't parse) — converted to hex once and hardcoded here.
const CREAM_BACKGROUND = '#efe9dc'
const INK_FOREGROUND = '#25352a'
const MUTED_FOREGROUND = '#5b6a5f'

async function loadFrauncesFont(): Promise<ArrayBuffer | null> {
  try {
    // An old-browser User-Agent gets Google's CSS2 API to hand back a
    // plain .ttf source instead of .woff2 — the image renderer (Satori)
    // only understands ttf/otf, not woff2.
    const cssRes = await fetch(
      'https://fonts.googleapis.com/css2?family=Fraunces:wght@600&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } },
    )
    const css = await cssRes.text()
    const match = css.match(/src: url\(([^)]+)\) format\('truetype'\)/)
    if (!match) return null
    const fontRes = await fetch(match[1])
    return await fontRes.arrayBuffer()
  } catch {
    return null
  }
}

export default async function OpengraphImage() {
  const [content, frauncesData] = await Promise.all([getSiteContent(), loadFrauncesFont()])

  let logoSrc = content.logo_image
  if (!logoSrc) {
    const file = await readFile(path.join(process.cwd(), 'public/brand/from-here-studio.png'))
    logoSrc = `data:image/png;base64,${file.toString('base64')}`
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: CREAM_BACKGROUND,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={320} height={320} style={{ objectFit: 'contain' }} />
        <div
          style={{
            marginTop: 20,
            fontSize: 56,
            color: INK_FOREGROUND,
            fontFamily: frauncesData ? 'Fraunces' : undefined,
          }}
        >
          made from here
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 20,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: MUTED_FOREGROUND,
          }}
        >
          art rooted in place
        </div>
      </div>
    ),
    {
      ...size,
      fonts: frauncesData
        ? [{ name: 'Fraunces', data: frauncesData, style: 'normal', weight: 600 }]
        : [],
    },
  )
}
