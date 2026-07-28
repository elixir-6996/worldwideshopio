import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CheckoutClient } from '@/components/checkout/checkout-client'
import { CART_COOKIE, parseCartCookie } from '@/lib/cart'
import { hydrateCart, type ShippingRates } from '@/lib/checkout'
import { getPublishedProducts, getStoreSettings } from '@/lib/products'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ coupon?: string }>
}) {
  const [{ coupon }, cookieStore, catalog, settings] = await Promise.all([
    searchParams,
    cookies(),
    getPublishedProducts(),
    getStoreSettings(),
  ])

  // Only products that still exist in the published catalog can be checked out.
  const cart = hydrateCart(parseCartCookie(cookieStore.get(CART_COOKIE)?.value), catalog)
  if (!cart.length) redirect('/cart')

  const rates: ShippingRates = {
    freeShippingThreshold: settings.freeShippingThreshold,
    standardShippingRate: settings.standardShippingRate,
    expressShippingRate: settings.expressShippingRate,
  }

  return (
    <CheckoutClient
      initialItems={cart.map(({ product, quantity, size, color }) => ({
        productId: product.id,
        quantity,
        size,
        color,
      }))}
      catalog={catalog}
      rates={rates}
      initialCoupon={coupon ?? ''}
    />
  )
}
