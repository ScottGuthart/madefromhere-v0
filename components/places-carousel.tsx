'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Collection } from '@/lib/types'
import { cn } from '@/lib/utils'

// Fixed card width so scroll-by-one-card math and the scroll-snap points
// agree with each other — a percentage-based card wouldn't let a plain
// `scrollBy` land exactly on the next snap point. Portrait (4:5), matching
// every other photo on the site (PlaceCard, the hero, gallery pieces) —
// place photos are shot vertically, and a landscape box here just crops
// them down instead of showing the actual composition.
const CARD_WIDTH = 96
const CARD_HEIGHT = 120
const CARD_GAP = 16

// A light, teaser-weight way to browse every place — just enough to invite
// a click through to /gallery for the real index. The full story-card
// treatment (photo, snippet, piece count) stays exclusive to /gallery
// itself so the homepage doesn't just read as a shorter copy of it.
export function PlacesCarousel({
  places,
  pieceCountByPlace = {},
}: {
  places: Collection[]
  pieceCountByPlace?: Record<number, number>
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  // Whether the row actually overflows its box at all — with only a
  // couple of places, everything can fit with nothing to scroll to, and
  // an arrow that does nothing is worse than no arrow.
  const [canScroll, setCanScroll] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanScroll(el.scrollWidth > el.clientWidth + 1)
    const step = CARD_WIDTH + CARD_GAP
    const index = Math.round(el.scrollLeft / step)
    setActiveIndex(Math.min(Math.max(index, 0), places.length - 1))
  }, [places.length])

  useEffect(() => {
    updateScrollState()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  function scrollByCard(direction: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: direction * (CARD_WIDTH + CARD_GAP), behavior: 'smooth' })
  }

  if (places.length === 0) return null

  const showLeftArrow = canScroll && activeIndex > 0
  const showRightArrow = canScroll && activeIndex < places.length - 1

  return (
    <div>
      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {places.map((place) => {
            const pieceCount = pieceCountByPlace[place.id] ?? 0
            return (
              <Link
                key={place.id}
                href={`/gallery/${place.id}`}
                className="group shrink-0 snap-start"
                style={{ width: CARD_WIDTH }}
              >
                <div
                  className="relative overflow-hidden bg-muted"
                  style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                >
                  <Image
                    src={place.cover_image_url || '/placeholder.svg'}
                    alt={place.title}
                    fill
                    sizes={`${CARD_WIDTH}px`}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 line-clamp-2 font-serif text-sm leading-tight transition-colors group-hover:text-accent">
                  {place.title}
                </p>
                {pieceCount > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {pieceCount} piece{pieceCount === 1 ? '' : 's'}
                  </p>
                )}
              </Link>
            )
          })}
        </div>

        {/* Fades hint that the row keeps going past the edge — only shown
         * on the side there's actually more to scroll to. */}
        {showLeftArrow && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent" />
        )}
        {showRightArrow && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
        )}

        {canScroll && (
          <>
            <button
              type="button"
              aria-label="Previous place"
              onClick={() => scrollByCard(-1)}
              disabled={!showLeftArrow}
              className={cn(
                'absolute -left-4 top-[calc(60px-16px)] hidden size-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-opacity hover:bg-muted md:flex',
                showLeftArrow ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next place"
              onClick={() => scrollByCard(1)}
              disabled={!showRightArrow}
              className={cn(
                'absolute -right-4 top-[calc(60px-16px)] hidden size-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-opacity hover:bg-muted md:flex',
                showRightArrow ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {canScroll && (
        <p className="mt-3 text-center text-xs uppercase tracking-widest text-muted-foreground">
          {activeIndex + 1} of {places.length}
        </p>
      )}
    </div>
  )
}
