import { CheckoutClient } from '@/components/checkout/checkout-client'
import type { CartPayloadItem } from '@/lib/checkout'
import { getDefaultCartItems, getStoreSettings, hydrateCartFromDatabase } from '@/lib/products'

export const dynamic = 'force-dynamic'

/**
 * The `?cart=` token only carries slugs and quantities. Everything priced or
 * displayed is resolved from the catalog on the server, so a hand-edited link
 * cannot inject a product or a price that does not exist.
 */
function parseCart(value?: string): CartPayloadItem[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is CartPayloadItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.productId === 'string' &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    )
  } catch {
    return []
  }
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ cart?: string; coupon?: string }>
}) {
  const { cart, coupon } = await searchParams
  const requested = parseCart(cart)
  const items = requested.length ? requested : await getDefaultCartItems()
  const [hydrated, settings] = await Promise.all([
    hydrateCartFromDatabase(items),
    getStoreSettings(),
  ])

  return <CheckoutClient cart={hydrated} initialCoupon={coupon ?? ''} rates={settings} />
}
