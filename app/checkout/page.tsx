import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CheckoutClient } from '@/components/checkout/checkout-client'
import { getCart } from '@/lib/cart'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your order securely.',
  robots: { index: false, follow: false },
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ coupon?: string }>
}) {
  const [{ coupon }, { cart, rates }] = await Promise.all([searchParams, getCart()])
  // Checkout is meaningless without lines, and the cookie cart is the only
  // source of truth, so an empty cart always goes back to the cart page.
  if (!cart.length) redirect('/cart')

  return <CheckoutClient cart={cart} rates={rates} initialCoupon={coupon ?? ''} />
}
