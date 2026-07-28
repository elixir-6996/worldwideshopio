'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application route error', error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center text-foreground">
      <div className="flex max-w-lg flex-col items-center gap-5">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
          Service interruption
        </p>
        <h1 className="font-serif text-4xl font-bold text-balance">
          We couldn&apos;t load this page
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Please try again. Your account and payment details remain secure.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  )
}
