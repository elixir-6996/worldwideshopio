import type { CartItem, Product } from '@/lib/store'

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

export type CartPayloadItem = {
  productId: string
  quantity: number
  size?: string
  color?: string
}

/**
 * Shipping money comes from the `store_settings` row so the admin panel is the
 * single source of truth. These values are only the fallback used when the
 * settings row has not been created yet.
 */
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
export const MAX_LINE_QUANTITY = 10

export function clampQuantity(quantity: number) {
  return Math.max(1, Math.min(Math.trunc(quantity) || 1, MAX_LINE_QUANTITY))
}

/** Turns cart payload items into cart lines using the supplied catalog. */
export function hydrateCart(items: CartPayloadItem[], catalog: Product[]): CartItem[] {
  return items.flatMap((item) => {
    const product = catalog.find((candidate) => candidate.id === item.productId)
    return product ? [{ ...item, product, quantity: clampQuantity(item.quantity) }] : []
  })
}

/** Reduces cart lines back to the payload shape server actions accept. */
export function toCartPayload(cart: CartItem[]): CartPayloadItem[] {
  return cart.map((item) => ({
    productId: item.product.id,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
  }))
}

/** Shipping cost before any coupon savings are applied. */
export function baseShippingFor(
  subtotal: number,
  delivery: DeliveryMethod,
  rates: ShippingRates = DEFAULT_SHIPPING_RATES,
) {
  if (delivery === 'express') return rates.expressShippingRate
  return subtotal > rates.freeShippingThreshold ? 0 : rates.standardShippingRate
}

/**
 * Pure pricing math over already-hydrated cart lines. Keeping it free of data
 * access lets the same function run on the server (for the authoritative order
 * total) and in the browser (for live summary updates).
 */
export function calculateTotals(
  cart: CartItem[],
  delivery: DeliveryMethod,
  savings: { discount?: number; shippingSavings?: number } = {},
  rates: ShippingRates = DEFAULT_SHIPPING_RATES,
) {
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const discount = Math.min(subtotal, Math.max(0, savings.discount ?? 0))
  const baseShipping = baseShippingFor(subtotal, delivery, rates)
  const shippingSavings = Math.min(baseShipping, Math.max(0, savings.shippingSavings ?? 0))
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
