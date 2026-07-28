import type { CartItem, Product } from '@/lib/store'
import { MAX_ITEM_QUANTITY, type CartPayloadItem } from '@/lib/cart'

export type { CartPayloadItem }

export type DeliveryMethod = 'standard' | 'express'
export type PaymentMethod = 'stripe' | 'razorpay' | 'paypal'

export type Address = {
  id?: string
  label: string
  firstName: string
  lastName: string
  street: string
  city: string
  region: string
  postalCode: string
  country: string
}

export type CheckoutDetails = {
  email: string
  address: Address
  deliveryMethod: DeliveryMethod
  paymentMethod: PaymentMethod
  coupon?: string
}

export type ShippingRates = {
  freeShippingThreshold: number
  standardShippingRate: number
  expressShippingRate: number
}

export const DEFAULT_SHIPPING_RATES: ShippingRates = {
  freeShippingThreshold: 200,
  standardShippingRate: 15,
  expressShippingRate: 30,
}

export const TAX_RATE = 0.0825

/**
 * Resolves cart identifiers against the live catalog. Unknown products are
 * dropped so a stale cookie can never inject a price the store does not offer.
 */
export function hydrateCart(items: CartPayloadItem[], catalog: Product[]): CartItem[] {
  const byId = new Map(catalog.map((product) => [product.id, product]))
  return items.flatMap((item) => {
    const product = byId.get(item.productId)
    if (!product) return []
    return [
      {
        ...item,
        product,
        quantity: Math.max(1, Math.min(item.quantity, MAX_ITEM_QUANTITY)),
      },
    ]
  })
}

export type OrderTotals = {
  subtotal: number
  discount: number
  shipping: number
  shippingSavings: number
  tax: number
  total: number
}

/**
 * Computes order totals from an already hydrated cart, so callers cannot
 * accidentally price a cart against a catalog it was not resolved with.
 */
export function calculateTotals(
  cart: CartItem[],
  delivery: DeliveryMethod,
  savings: { discount?: number; shippingSavings?: number } = {},
  rates: ShippingRates = DEFAULT_SHIPPING_RATES,
): OrderTotals {
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const discount = Math.min(subtotal, Math.max(0, Math.round(savings.discount ?? 0)))
  const baseShipping =
    delivery === 'express'
      ? rates.expressShippingRate
      : subtotal > rates.freeShippingThreshold
        ? 0
        : rates.standardShippingRate
  const shippingSavings = Math.min(baseShipping, Math.max(0, Math.round(savings.shippingSavings ?? 0)))
  const shipping = baseShipping - shippingSavings
  const tax = Math.round((subtotal - discount) * TAX_RATE)
  return {
    subtotal,
    discount,
    shipping,
    shippingSavings,
    tax,
    total: subtotal - discount + shipping + tax,
  }
}
