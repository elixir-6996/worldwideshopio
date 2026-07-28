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

/** Maximum units of a single product allowed in one order. */
export const MAX_ITEM_QUANTITY = 10

/** Sales tax applied to the discounted subtotal. */
export const TAX_RATE = 0.0825

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

/** Clamps a requested quantity into the allowed 1…MAX_ITEM_QUANTITY range. */
export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1
  return Math.max(1, Math.min(Math.trunc(quantity), MAX_ITEM_QUANTITY))
}

/**
 * Joins persisted cart lines with catalog products. Lines referencing products
 * that no longer exist (or were unpublished) are dropped.
 */
export function hydrateCart(items: CartPayloadItem[], catalog: Product[]): CartItem[] {
  const byId = new Map(catalog.map((product) => [product.id, product]))
  return items.flatMap((item) => {
    const product = byId.get(item.productId)
    if (!product) return []
    return [
      {
        product,
        quantity: clampQuantity(item.quantity),
        size: item.size,
        color: item.color,
      },
    ]
  })
}

export function cartSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
}

export function cartCount(cart: Pick<CartItem, 'quantity'>[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}

/** Base shipping cost before any coupon savings are applied. */
export function baseShipping(
  subtotal: number,
  delivery: DeliveryMethod,
  rates: ShippingRates = DEFAULT_SHIPPING_RATES,
): number {
  if (delivery === 'express') return rates.expressShippingRate
  return subtotal >= rates.freeShippingThreshold ? 0 : rates.standardShippingRate
}

export type CheckoutTotals = {
  subtotal: number
  discount: number
  shipping: number
  shippingSavings: number
  tax: number
  total: number
}

/**
 * Computes order totals from a hydrated cart. Discounts are capped at the
 * subtotal, shipping savings at the base shipping cost, and tax is charged on
 * the discounted subtotal.
 */
export function calculateTotals(
  cart: CartItem[],
  delivery: DeliveryMethod,
  savings: { discount?: number; shippingSavings?: number } = {},
  rates: ShippingRates = DEFAULT_SHIPPING_RATES,
): CheckoutTotals {
  const subtotal = cartSubtotal(cart)
  const discount = Math.min(subtotal, Math.max(0, savings.discount ?? 0))
  const base = baseShipping(subtotal, delivery, rates)
  const shippingSavings = Math.min(base, Math.max(0, savings.shippingSavings ?? 0))
  const shipping = base - shippingSavings
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
