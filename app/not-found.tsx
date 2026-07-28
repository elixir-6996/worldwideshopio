import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-24 text-center">
        <div className="flex max-w-lg flex-col items-center gap-5">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">404</p>
          <h1 className="font-serif text-4xl font-bold text-balance">
            This page is out of collection
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            The page may have moved or is no longer available.
          </p>
          <Button asChild>
            <Link href="/products">Explore the collection</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
