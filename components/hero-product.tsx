'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Hero foreground artwork — the supplied, final composition.
 *
 * This single transparent PNG already contains the model, the golden orbit ring
 * (correctly passing behind the torso and in front of the legs), the platform,
 * the glow beneath it and the contact shadow, all with baked-in depth and
 * lighting. It is therefore treated as ONE indivisible foreground asset:
 *
 *  - no ring, platform, pedestal, shadow or glow is drawn separately,
 *  - no filters, blend modes or drop shadows are applied on top,
 *
 * so what renders is pixel-for-pixel the delivered artwork.
 */
export const HERO_PRODUCT_IMAGE = '/images/hero-model.png'

export type HeroProductProps = {
  /** Any PNG/WebP with transparency. Aspect ratio is always preserved. */
  src?: string
  alt?: string
  /** Renders the image eagerly (only for above-the-fold LCP tuning). */
  priority?: boolean
  className?: string
}

/**
 * Reusable premium product stage.
 *
 * The stage box is locked to the artwork's 2:3 aspect ratio and sized off the
 * hero height, so swapping the image never shifts the hero layout or causes
 * CLS. `object-contain` guarantees the artwork can never stretch, distort or
 * clip — the head and the platform always stay fully in frame.
 */
export function HeroProduct({
  src = HERO_PRODUCT_IMAGE,
  alt = 'Featured luxury look',
  priority = false,
  className,
}: HeroProductProps) {
  return (
    <div
      className={cn(
        // Breakpoints below are CONTAINER queries against the hero canvas,
        // which is viewport-width at every size. The stage is always
        // rendered and always `block` — it is never hidden at any width.
        // Below 768px none of the `@min-` queries match, so the phone
        // position and scale come from `.hero-product-stage` in globals.css.
        'hero-product-stage pointer-events-none absolute z-[15] block aspect-[2/3] -translate-x-1/2',
        // Sits in the centre-right of the hero, balanced against the large
        // heading. Tablet scales down and shifts further left so the figure
        // never runs under the right-hand category cards.
        '@min-[768px]:left-[46%] @min-[768px]:top-[9%] @min-[768px]:h-[88%] @min-[1024px]:left-[51%] @min-[1024px]:top-[2%] @min-[1024px]:h-[98%]',
        className,
      )}
    >
      {/* Supplied artwork, rendered untouched: aspect preserved, auto scaled,
          never clipped, no added lighting or effects. */}
      {/* `transform-gpu` + `will-change` promote the floating figure to its own
          compositor layer, so its continuous GSAP drift never repaints the
          background plate behind it. */}
      <div className="hero-product-media relative h-full w-full transform-gpu will-change-transform">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          // Decoding off the main thread keeps the hero's first paint smooth.
          decoding="async"
          sizes="(max-width: 1024px) 58vw, 42vw"
          className="object-contain object-center"
        />
      </div>
    </div>
  )
}
