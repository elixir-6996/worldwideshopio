import type { Metadata } from 'next'
import { CartClient } from '@/components/cart/cart-client'
import { getCart } from '@/lib/cart'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review the items in your cart before checkout.',
  robots: { index: false, follow: true },
}

export default async function CartPage() {
  const { cart, rates } = await getCart()
  return <CartClient cart={cart} rates={rates} />
}
