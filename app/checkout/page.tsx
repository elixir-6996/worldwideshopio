import type { Metadata } from 'next'
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

  // The empty-cart state lives inside CheckoutClient rather than here on
  // purpose. Placing an order clears the cart cookie from a server action,
  // which re-renders this route; branching at this level would swap the client
  // component out and discard the order confirmation the shopper needs to see.
  return <CheckoutClient cart={cart} rates={rates} initialCoupon={coupon ?? ''} />
}
