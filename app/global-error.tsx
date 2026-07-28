'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="bg-background font-sans text-foreground antialiased">
        <main className="flex min-h-screen items-center justify-center px-4 text-center">
          <div className="flex max-w-lg flex-col items-center gap-5">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              Temporary issue
            </p>
            <h1 className="font-serif text-4xl font-bold">Worldwide Shopio is unavailable</h1>
            <p className="text-muted-foreground leading-relaxed">
              Please retry your request. No payment will be submitted twice.
            </p>
            <button
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
              onClick={reset}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
