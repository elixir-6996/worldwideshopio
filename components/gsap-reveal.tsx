'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

type GsapRevealProps = {
  children: ReactNode
  className?: string
  stagger?: number
  parallax?: boolean
}

export function GsapReveal({
  children,
  className,
  stagger = 0.1,
  parallax = false,
}: GsapRevealProps) {
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const node = root.current
    if (!node) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      gsap.set(node.querySelectorAll<HTMLElement>('[data-gsap]'), { clearProps: 'all' })
      return
    }

    const context = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('[data-gsap]')
      if (items.length) {
        gsap.fromTo(
          items,
          { autoAlpha: 0, y: 42 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.05,
            stagger,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: node,
              start: 'top 84%',
              once: true,
            },
          },
        )
      }

      gsap.utils.toArray<HTMLElement>('[data-gsap-media]').forEach((media) => {
        gsap.fromTo(
          media,
          { clipPath: 'inset(0 0 100% 0)', scale: 1.06 },
          {
            clipPath: 'inset(0 0 0% 0)',
            scale: 1,
            duration: 1.25,
            ease: 'power4.out',
            scrollTrigger: { trigger: media, start: 'top 88%', once: true },
          },
        )
      })

      if (parallax) {
        gsap.utils.toArray<HTMLElement>('[data-gsap-parallax]').forEach((media) => {
          gsap.fromTo(
            media,
            { yPercent: -4 },
            {
              yPercent: 4,
              ease: 'none',
              scrollTrigger: {
                trigger: node,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.8,
              },
            },
          )
        })
      }
    }, node)

    return () => context.revert()
  }, [parallax, stagger])

  return (
    <div ref={root} className={cn('contents', className)}>
      {children}
    </div>
  )
}
