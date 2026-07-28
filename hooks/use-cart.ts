'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CART_COOKIE,
  addCartLine,
  cartQuantity,
  parseCartCookie,
  removeCartLine,
  serializeCartCookie,
  updateCartQuantity,
  type CartPayloadItem,
} from '@/lib/cart'

const CART_EVENT = 'luxe:cart-change'
const ONE_YEAR = 60 * 60 * 24 * 365

function readCookie(): CartPayloadItem[] {
  if (typeof document === 'undefined') return []
  const match = document.cookie.split('; ').find((entry) => entry.startsWith(`${CART_COOKIE}=`))
  return parseCartCookie(match?.slice(CART_COOKIE.length + 1))
}

function writeCookie(items: CartPayloadItem[]) {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CART_COOKIE}=${serializeCartCookie(items)}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`
  window.dispatchEvent(new CustomEvent<CartPayloadItem[]>(CART_EVENT, { detail: items }))
}

/**
 * Reads and writes the cart cookie. `initialItems` comes from the server so the
 * first paint matches the server-rendered markup, then the cookie becomes the
 * source of truth and every consumer stays in sync through a window event.
 */
export function useCart(initialItems: CartPayloadItem[] = []) {
  const [items, setItems] = useState<CartPayloadItem[]>(initialItems)

  useEffect(() => {
    setItems(readCookie())
    const sync = () => setItems(readCookie())
    window.addEventListener(CART_EVENT, sync)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener(CART_EVENT, sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  const commit = useCallback((next: CartPayloadItem[]) => {
    setItems(next)
    writeCookie(next)
  }, [])

  const add = useCallback(
    (item: CartPayloadItem) => commit(addCartLine(readCookie(), item)),
    [commit],
  )

  const updateQuantity = useCallback(
    (key: string, delta: number) => commit(updateCartQuantity(readCookie(), key, delta)),
    [commit],
  )

  const remove = useCallback((key: string) => commit(removeCartLine(readCookie(), key)), [commit])

  const clear = useCallback(() => commit([]), [commit])

  return { items, count: cartQuantity(items), add, updateQuantity, remove, clear }
}
