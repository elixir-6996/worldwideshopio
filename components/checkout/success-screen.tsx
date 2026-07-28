'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SuccessScreen({ orderNumber, email }: { orderNumber: string; email: string }) {
  const ringRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .from(ringRef.current, { scale: 0, rotate: -90, duration: 0.55, ease: 'back.out(1.7)' })
        .from(
          contentRef.current?.children ?? [],
          { y: 18, opacity: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' },
          '-=0.2',
        )
    })
    return () => ctx.revert()
  }, [])

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
        <div
          ref={ringRef}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/15 ring-4 ring-brand/20"
        >
          <Check className="h-10 w-10 text-brand" />
        </div>
        <div ref={contentRef} className="flex flex-col items-center gap-4">
          <h1 className="font-serif text-3xl font-bold text-foreground">Order confirmed</h1>
          <p className="leading-relaxed text-muted-foreground">
            Thank you. A confirmation has been sent to{' '}
            <span className="text-foreground">{email || 'your email'}</span>.
          </p>
          <p className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground">
            Order #{orderNumber}
          </p>
          <div className="mt-2 flex gap-3">
            <Button asChild variant="outline" className="border-border">
              <Link href="/dashboard">View orders</Link>
            </Button>
            <Button asChild className="bg-foreground text-background hover:bg-foreground/80">
              <Link href="/products">Continue shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
