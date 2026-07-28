import Link from 'next/link'
import type { Metadata } from 'next'
import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { CheckoutClient } from '@/components/checkout/checkout-client'
import { getCart } from '@/lib/cart'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ coupon?: string }>
}) {
  const [{ coupon }, { cart, rates }] = await Promise.all([searchParams, getCart()])

  if (!cart.length) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h1 className="font-serif text-3xl font-bold text-foreground">Your cart is empty</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Add a few pieces to your cart before heading to checkout.
          </p>
          <Button asChild className="bg-foreground text-background hover:bg-foreground/80">
            <Link href="/products">Browse products</Link>
          </Button>
        </main>
      </div>
    )
  }

  return <CheckoutClient cart={cart} rates={rates} initialCoupon={coupon ?? ''} />
}
