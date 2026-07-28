/**
 * Guest cart storage.
 *
 * The cart lives in a readable cookie so both the browser and server
 * components can see it, while every price, name and image is always resolved
 * from the database catalog at render time. Only identifiers and quantities are
 * ever persisted client-side, so stale or tampered cookies can never change
 * what a customer is charged.
 */

export const CART_COOKIE = 'luxe_cart'
export const MAX_ITEM_QUANTITY = 10
export const MAX_CART_LINES = 50

export type CartPayloadItem = {
  productId: string
  quantity: number
  size?: string
  color?: string
}

/** Stable identity for a cart line: same product but different size is a new line. */
export function cartLineKey(item: Pick<CartPayloadItem, 'productId' | 'size' | 'color'>) {
  return `${item.productId}|${item.size ?? ''}|${item.color ?? ''}`
}

function clampQuantity(quantity: number) {
  return Math.max(1, Math.min(Math.trunc(quantity), MAX_ITEM_QUANTITY))
}

/** Accepts unknown input (cookie, query string) and returns a safe cart. */
export function normalizeCartItems(value: unknown): CartPayloadItem[] {
  if (!Array.isArray(value)) return []
  const lines = new Map<string, CartPayloadItem>()

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue
    const candidate = entry as Record<string, unknown>
    const productId = typeof candidate.productId === 'string' ? candidate.productId.trim() : ''
    const quantity = Number(candidate.quantity)
    if (!productId || !Number.isFinite(quantity) || quantity < 1) continue

    const item: CartPayloadItem = {
      productId,
      quantity: clampQuantity(quantity),
      size: typeof candidate.size === 'string' && candidate.size ? candidate.size : undefined,
      color: typeof candidate.color === 'string' && candidate.color ? candidate.color : undefined,
    }

    const key = cartLineKey(item)
    const existing = lines.get(key)
    lines.set(
      key,
      existing ? { ...existing, quantity: clampQuantity(existing.quantity + item.quantity) } : item,
    )
    if (lines.size >= MAX_CART_LINES) break
  }

  return [...lines.values()]
}

export function parseCartCookie(raw?: string | null): CartPayloadItem[] {
  if (!raw) return []
  try {
    return normalizeCartItems(JSON.parse(decodeURIComponent(raw)))
  } catch {
    return []
  }
}

export function serializeCartCookie(items: CartPayloadItem[]): string {
  return encodeURIComponent(JSON.stringify(normalizeCartItems(items)))
}

/** Adds a line, merging with an identical product/size/color combination. */
export function addCartLine(items: CartPayloadItem[], item: CartPayloadItem): CartPayloadItem[] {
  return normalizeCartItems([...items, item])
}

export function updateCartQuantity(
  items: CartPayloadItem[],
  key: string,
  delta: number,
): CartPayloadItem[] {
  return items.flatMap((item) => {
    if (cartLineKey(item) !== key) return [item]
    const quantity = item.quantity + delta
    if (quantity < 1) return []
    return [{ ...item, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) }]
  })
}

export function removeCartLine(items: CartPayloadItem[], key: string): CartPayloadItem[] {
  return items.filter((item) => cartLineKey(item) !== key)
}

export function cartQuantity(items: CartPayloadItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0)
}
