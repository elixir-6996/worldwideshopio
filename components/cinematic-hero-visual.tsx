'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ArrowUpRight } from 'lucide-react'
import { HeroProduct } from './hero-product'

/**
 * Ambient gold motes.
 *
 * Purely additive atmosphere for depth — they are tiny, low-opacity and drift
 * slowly, so they read as light dust in the volumetric glow rather than as
 * decoration. Positions are hand-placed (never random) so every render and
 * every SSR/CSR pass is identical, and they are animated with `transform`
 * only, which keeps them on the compositor and off the main thread.
 */
const HERO_MOTES = [
  { left: '30%', top: '26%', size: 3, drift: -22, duration: 9, delay: 0 },
  { left: '38%', top: '62%', size: 2, drift: -16, duration: 11, delay: 1.4 },
  { left: '44%', top: '18%', size: 2, drift: -26, duration: 12, delay: 0.6 },
  { left: '52%', top: '48%', size: 3, drift: -18, duration: 10, delay: 2.1 },
  { left: '58%', top: '30%', size: 2, drift: -24, duration: 13, delay: 1 },
  { left: '63%', top: '70%', size: 2, drift: -14, duration: 9.5, delay: 2.6 },
  { left: '68%', top: '22%', size: 3, drift: -20, duration: 11.5, delay: 0.3 },
  { left: '74%', top: '56%', size: 2, drift: -17, duration: 12.5, delay: 1.8 },
  { left: '82%', top: '36%', size: 2, drift: -23, duration: 10.5, delay: 0.9 },
  { left: '88%', top: '66%', size: 3, drift: -15, duration: 13.5, delay: 2.3 },
]

const HERO_CARDS = [
  {
    eyebrow: 'Premium',
    title: 'Sneakers',
    image: '/images/hero-card-sneaker.png',
    href: '/products?cat=sneakers',
  },
  {
    eyebrow: 'Luxury',
    title: 'Bags',
    image: '/images/hero-card-bag.png',
    href: '/products?cat=accessories',
  },
  {
    eyebrow: 'High-End',
    title: 'Accessories',
    image: '/images/hero-card-accessories.png',
    href: '/products?cat=accessories',
  },
]

export function CinematicHeroVisual() {
  const root = useRef<HTMLDivElement>(null)
  const cards = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const context = gsap.context(() => {
      // Every tween below animates only compositor-friendly properties
      // (transform / opacity) and is forced onto the GPU, so the hero's
      // continuous motion costs no layout or paint work.
      gsap.defaults({ force3D: true })

      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .fromTo(
          '.hero-map-layer',
          { opacity: 0, scale: 1.04 },
          { opacity: 1, scale: 1, duration: 2, ease: 'sine.out' },
        )
        .fromTo(
          '.hero-product-stage',
          { opacity: 0, scale: 0.94 },
          { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' },
          '-=1.4',
        )
        .fromTo(
          '.hero-product-card',
          { opacity: 0 },
          { opacity: 1, duration: 0.9, stagger: 0.12 },
          '-=1',
        )
        .fromTo(
          '.hero-card-inner',
          { x: 34, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.9, stagger: 0.12 },
          '<',
        )

      gsap.to(cards.current, {
        y: -8,
        duration: 4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1.2,
      })

      gsap.to('.hero-product-media', {
        y: -10,
        duration: 4.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1,
      })

      // Ambient motes: a slow vertical drift with an out-of-phase opacity
      // pulse per mote, so the dust never looks like it blinks in unison.
      gsap.utils.toArray<HTMLElement>('.hero-mote').forEach((mote, index) => {
        const config = HERO_MOTES[index]
        if (!config) return

        gsap.fromTo(
          mote,
          { y: 0, opacity: 0.12 },
          {
            y: config.drift,
            // Deliberately capped well below full opacity: luxury dust should
            // be felt, not seen.
            opacity: index % 2 === 0 ? 0.45 : 0.3,
            duration: config.duration,
            delay: config.delay,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          },
        )
      })

      // Very gentle breathing on the supplied background. It only modulates
      // overall opacity, so the artwork's baked lighting is never altered.
      gsap.to('.hero-map-layer', {
        opacity: 0.88,
        duration: 6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 2,
      })
    }, root)

    return () => context.revert()
  }, [])

  return (
    <div ref={root} className="pointer-events-none absolute inset-0">
      {/* ── LAYER 1: supplied hero background ────────────────────────────────
          The final glowing world-map plate, used exactly as delivered: all of
          its golden lighting, connection lines, bloom and atmosphere are baked
          in, so no extra light, beam, ray, fog or glow layer is drawn over it.
          Its own edges are already pure black, and `object-cover` on a black
          hero means it reads as one continuous image with no seam, band or
          rectangular join. */}
      <div className="hero-map-layer absolute inset-0 transform-gpu opacity-0 will-change-[transform,opacity]">
        <Image
          src="/images/hero-background.png"
          alt=""
          fill
          aria-hidden="true"
          // This is the hero's LCP element, so it is fetched with priority and
          // served as an optimised, responsive Next.js Image. Deferring it
          // measurably hurt LCP.
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>

      {/* ── LAYER 2: legibility grading ──────────────────────────────────────
          A single left-to-right falloff so the headline side stays readable.
          It fades to fully transparent well before the model, leaving the
          supplied artwork ungraded.

          Below 768px `.hero-scrim` (globals.css) swaps this for a vertical
          falloff, because the phone copy spans the full width rather than
          sitting in a left column. */}
      <div
        aria-hidden="true"
        className="hero-scrim absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent"
      />

      {/* ── LAYER 2b: cinematic vignette ─────────────────────────────────────
          A single radial falloff that is fully transparent across the centre
          and only deepens the extreme corners. Because the supplied plate is
          already black at its edges, this adds camera-style depth and pulls
          the eye to the model without touching the artwork's baked lighting,
          hue or exposure anywhere it is actually visible. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(115%_105%_at_50%_45%,transparent_52%,oklch(0_0_0/0.42)_100%)]"
      />

      {/* ── LAYER 2c: ambient motes ──────────────────────────────────────────
          Fine gold dust suspended in the volumetric glow, sitting behind the
          model so the figure always stays the focal point. */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        {HERO_MOTES.map((mote, index) => (
          <span
            key={`${mote.left}-${mote.top}`}
            className="hero-mote absolute rounded-full bg-primary/70 opacity-0 blur-[1px] will-change-transform"
            style={{
              left: mote.left,
              top: mote.top,
              width: mote.size,
              height: mote.size,
              // Static fallback for reduced-motion users, where GSAP never runs.
              opacity: index % 2 === 0 ? 0.4 : 0.28,
            }}
          />
        ))}
      </div>

      {/* ── LAYER 3: supplied foreground (model + orbit ring + platform +
          glow + shadow, all baked into one transparent PNG) ───────────────── */}
      <HeroProduct priority />

      {/* Right-side premium glass cards */}
      <div
        ref={cards}
        /* Breakpoints are CONTAINER queries against the hero canvas (see
           `.hero-canvas`), not the viewport.

           The cards are never hidden: below 768px `.hero-card-rail`
           (globals.css) re-positions this same stack as a compact horizontal
           rail pinned inside the hero's bottom edge, so every desktop hero
           element is present on mobile at a phone-appropriate scale. From
           768px up the original right-edge vertical stack is restored
           verbatim. */
        className="hero-card-rail pointer-events-auto absolute right-6 top-1/2 z-20 flex w-64 -translate-y-1/2 transform-gpu flex-col gap-4 will-change-transform @min-[1280px]:w-72"
      >
        {HERO_CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            /* Same box, same position, same size — only the material is
               richer: deeper glass, a grounded drop shadow that lifts into a
               warm gold bloom on hover, and a compositor-only transform so the
               lift never triggers layout. */
            className="hero-product-card group relative flex h-[8.5rem] transform-gpu items-center overflow-hidden rounded-2xl border border-primary/25 bg-white/[0.04] p-4 opacity-0 shadow-[0_18px_48px_-22px_oklch(0_0_0/0.85)] backdrop-blur-xl transition-[transform,border-color,background-color,box-shadow] duration-300 ease-out will-change-transform hover:-translate-y-1 hover:border-primary/60 hover:bg-white/[0.07] hover:shadow-[0_26px_64px_-24px_oklch(0.8_0.12_80/0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"
          >
            <div className="hero-card-inner absolute inset-0 flex items-center p-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
              {/* Inner gold rim: reads as light caught on the glass edge. */}
              <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_oklch(1_0_0/0.1),inset_0_0_28px_-14px_oklch(0.8_0.12_80/0.55)]" />
              <div className="absolute inset-0 bg-[radial-gradient(70%_120%_at_100%_50%,oklch(0.8_0.12_80/0.14),transparent_70%)] opacity-75 transition-opacity duration-500 group-hover:opacity-100" />
              {/* Specular sweep on hover only. It animates `translate` (not
                  `left`), so the whole sweep stays on the compositor. */}
              <div className="pointer-events-none absolute -inset-y-8 left-0 w-1/3 -translate-x-full -skew-x-12 transform-gpu bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-[transform,opacity] duration-700 ease-out group-hover:translate-x-[340%] group-hover:opacity-100" />

              <div className="hero-card-copy relative z-10 flex flex-col gap-1">
                <span className="hero-card-eyebrow text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                  {card.eyebrow}
                </span>
                <span className="hero-card-title font-serif text-xl font-bold leading-tight text-foreground">
                  {card.title}
                </span>
                <span className="hero-card-cta mt-1 flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-foreground">
                  Explore Now <ArrowUpRight className="h-3 w-3 text-primary" />
                </span>
              </div>

              {/* Premium product render */}
              <div className="hero-card-thumb pointer-events-none absolute -right-2 top-1/2 h-28 w-32 -translate-y-1/2">
                <Image
                  src={card.image}
                  alt={`${card.eyebrow} ${card.title}`}
                  fill
                  className="object-contain drop-shadow-[0_10px_24px_oklch(0_0_0/0.8)] transition-transform duration-500 group-hover:scale-105"
                  sizes="140px"
                />
              </div>

              {/* Gold arrow button */}
              <span className="hero-card-arrow absolute bottom-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_18px_oklch(0.8_0.12_80/0.45)] transition-transform duration-300 group-hover:scale-110">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
