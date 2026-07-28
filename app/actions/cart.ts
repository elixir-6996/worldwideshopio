'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCart, readCartItems, sameLine, writeCartItems } from '@/lib/cart'
import { cartCount, clampQuantity, MAX_ITEM_QUANTITY, type CartPayloadItem } from '@/lib/checkout'
import { getProductBySlug } from '@/lib/products'

const lineSchema = z.object({
  productId: z.string().min(1).max(120),
  quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY).default(1),
  size: z.string().max(40).optional(),
  color: z.string().max(40).optional(),
})

export type CartActionResult = { count: number; error?: string }

function refresh() {
  revalidatePath('/cart')
  revalidatePath('/checkout')
}

/** Adds a product to the cookie cart, merging matching size/color lines. */
export async function addToCart(input: {
  productId: string
  quantity?: number
  size?: string
  color?: string
}): Promise<CartActionResult> {
  const line = lineSchema.parse(input)
  const product = await getProductBySlug(line.productId)
  if (!product) return { count: await currentCount(), error: 'This product is no longer available.' }
  if (!product.inStock) return { count: await currentCount(), error: 'This product is out of stock.' }

  const items = await readCartItems()
  const existing = items.find((item) => sameLine(item, line))
  const next: CartPayloadItem[] = existing
    ? items.map((item) =>
        sameLine(item, line) ? { ...item, quantity: clampQuantity(item.quantity + line.quantity) } : item,
      )
    : [...items, line]

  const saved = await writeCartItems(next)
  refresh()
  return { count: cartCount(saved) }
}

/** Sets an absolute quantity for one line; quantity 0 removes it. */
export async function updateCartQuantity(input: {
  productId: string
  quantity: number
  size?: string
  color?: string
}): Promise<CartActionResult> {
  const line = lineSchema.extend({ quantity: z.number().int().min(0).max(MAX_ITEM_QUANTITY) }).parse(input)
  const items = await readCartItems()
  const next =
    line.quantity === 0
      ? items.filter((item) => !sameLine(item, line))
      : items.map((item) => (sameLine(item, line) ? { ...item, quantity: line.quantity } : item))
  const saved = await writeCartItems(next)
  refresh()
  return { count: cartCount(saved) }
}

/** Removes one line from the cart. */
export async function removeFromCart(input: {
  productId: string
  size?: string
  color?: string
}): Promise<CartActionResult> {
  const line = lineSchema.partial({ quantity: true }).parse(input)
  const items = await readCartItems()
  const saved = await writeCartItems(items.filter((item) => !sameLine(item, { ...line, quantity: 1 })))
  refresh()
  return { count: cartCount(saved) }
}

/** Empties the cart entirely. */
export async function clearCart(): Promise<CartActionResult> {
  await writeCartItems([])
  refresh()
  return { count: 0 }
}

/** Server-side snapshot used by the checkout flow. */
export async function getCartSnapshot() {
  const { cart, count, rates } = await getCart()
  return { cart, count, rates }
}

async function currentCount() {
  return cartCount(await readCartItems())
}
