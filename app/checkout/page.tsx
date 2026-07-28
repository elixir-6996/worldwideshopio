import { CheckoutClient } from '@/components/checkout/checkout-client'
import { DEFAULT_CART, type CartPayloadItem } from '@/lib/checkout'

function parseCart(value?: string): CartPayloadItem[] {
  if (!value) return DEFAULT_CART
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (!Array.isArray(parsed)) return DEFAULT_CART
    const items = parsed.filter(
      (item): item is CartPayloadItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.productId === 'string' &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    )
    return items.length ? items : DEFAULT_CART
  } catch {
    return DEFAULT_CART
  }
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ cart?: string; coupon?: string }>
}) {
  const { cart, coupon } = await searchParams
  return <CheckoutClient initialItems={parseCart(cart)} initialCoupon={coupon ?? ''} />
}
