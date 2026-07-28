import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { CartClient } from '@/components/cart-client'
import { CART_COOKIE, parseCartCookie } from '@/lib/cart'
import { getPublishedProducts, getStoreSettings } from '@/lib/products'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review the items in your cart and continue to secure checkout.',
  robots: { index: false, follow: true },
}

export default async function CartPage() {
  const [cookieStore, catalog, settings] = await Promise.all([
    cookies(),
    getPublishedProducts(),
    getStoreSettings(),
  ])

  return (
    <CartClient
      initialItems={parseCartCookie(cookieStore.get(CART_COOKIE)?.value)}
      catalog={catalog}
      rates={{
        freeShippingThreshold: settings.freeShippingThreshold,
        standardShippingRate: settings.standardShippingRate,
        expressShippingRate: settings.expressShippingRate,
      }}
    />
  )
}
