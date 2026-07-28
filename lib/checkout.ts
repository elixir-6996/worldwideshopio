import { PRODUCTS, type CartItem } from '@/lib/store'

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

export const DEFAULT_CART: CartPayloadItem[] = [
  { productId: 'p1', quantity: 1, size: 'M', color: 'Black' },
  { productId: 'p3', quantity: 1 },
]

export function hydrateCart(items: CartPayloadItem[]): CartItem[] {
  return items.flatMap((item) => {
    const product = PRODUCTS.find((candidate) => candidate.id === item.productId)
    return product ? [{ ...item, product, quantity: Math.max(1, Math.min(item.quantity, 10)) }] : []
  })
}

export function calculateTotals(
  items: CartPayloadItem[],
  delivery: DeliveryMethod,
  savings: { discount?: number; shippingSavings?: number } = {},
) {
  const cart = hydrateCart(items)
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const discount = Math.min(subtotal, Math.max(0, savings.discount ?? 0))
  const baseShipping = delivery === 'express' ? 30 : subtotal > 200 ? 0 : 15
  const shippingSavings = Math.min(baseShipping, Math.max(0, savings.shippingSavings ?? 0))
  const shipping = baseShipping - shippingSavings
  const tax = Math.round((subtotal - discount) * 0.0825)
  return {
    subtotal,
    discount,
    shipping,
    shippingSavings,
    tax,
    total: subtotal - discount + shipping + tax,
  }
}
