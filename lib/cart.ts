import 'server-only'

import { cookies } from 'next/headers'
import { getPublishedProducts, getStoreSettings } from '@/lib/products'
import {
  cartCount,
  clampQuantity,
  hydrateCart,
  type CartPayloadItem,
  type ShippingRates,
} from '@/lib/checkout'
import type { CartItem } from '@/lib/store'

export const CART_COOKIE = 'luxe_cart'

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
} as const

/** Maximum distinct lines kept in the cookie so it never outgrows the 4KB budget. */
const MAX_LINES = 40

function sanitize(value: unknown): CartPayloadItem[] {
  if (!Array.isArray(value)) return []
  const lines: CartPayloadItem[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue
    const item = entry as Record<string, unknown>
    if (typeof item.productId !== 'string' || !item.productId) continue
    const quantity = typeof item.quantity === 'number' ? clampQuantity(item.quantity) : 1
    lines.push({
      productId: item.productId,
      quantity,
      size: typeof item.size === 'string' && item.size ? item.size : undefined,
      color: typeof item.color === 'string' && item.color ? item.color : undefined,
    })
  }
  return lines.slice(0, MAX_LINES)
}

/** Raw cart lines from the cookie. Never throws on malformed input. */
export async function readCartItems(): Promise<CartPayloadItem[]> {
  const raw = (await cookies()).get(CART_COOKIE)?.value
  if (!raw) return []
  try {
    return sanitize(JSON.parse(decodeURIComponent(raw)))
  } catch {
    return []
  }
}

/** Persists cart lines to the cookie, deleting it when the cart is empty. */
export async function writeCartItems(items: CartPayloadItem[]): Promise<CartPayloadItem[]> {
  const store = await cookies()
  const lines = sanitize(items)
  if (!lines.length) {
    store.delete(CART_COOKIE)
    return []
  }
  store.set(CART_COOKIE, encodeURIComponent(JSON.stringify(lines)), COOKIE_OPTIONS)
  return lines
}

export function sameLine(a: CartPayloadItem, b: CartPayloadItem): boolean {
  return a.productId === b.productId && a.size === b.size && a.color === b.color
}

export type HydratedCart = {
  items: CartPayloadItem[]
  cart: CartItem[]
  count: number
  rates: ShippingRates
}

/**
 * Reads the cookie cart and joins it with the live catalog. Lines whose product
 * is gone are pruned from the returned data (the cookie itself is rewritten on
 * the next mutation).
 */
export async function getCart(): Promise<HydratedCart> {
  const [items, catalog, settings] = await Promise.all([
    readCartItems(),
    getPublishedProducts(),
    getStoreSettings(),
  ])
  const cart = hydrateCart(items, catalog)
  return {
    items: cart.map(({ product, quantity, size, color }) => ({
      productId: product.id,
      quantity,
      size,
      color,
    })),
    cart,
    count: cartCount(cart),
    rates: {
      freeShippingThreshold: settings.freeShippingThreshold,
      standardShippingRate: settings.standardShippingRate,
      expressShippingRate: settings.expressShippingRate,
    },
  }
}

/** Cart badge count without loading the full catalog join cost twice. */
export async function getCartCount(): Promise<number> {
  const items = await readCartItems()
  return cartCount(items)
}
