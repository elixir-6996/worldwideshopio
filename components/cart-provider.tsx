'use client'

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from 'react'
import { addToCart } from '@/app/actions/cart'

type CartContextValue = {
  count: number
  setCount: (count: number) => void
}

const CartContext = createContext<CartContextValue>({ count: 0, setCount: () => {} })

/**
 * Holds the cart badge count on the client so every Navbar instance stays in
 * sync after a cart mutation, without refetching on mount. The initial value is
 * read from the cookie cart on the server.
 */
export function CartProvider({
  initialCount,
  children,
}: {
  initialCount: number
  children: React.ReactNode
}) {
  const [count, setCountState] = useState(initialCount)
  const setCount = useCallback((next: number) => setCountState(Math.max(0, next)), [])
  const value = useMemo(() => ({ count, setCount }), [count, setCount])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}

export type AddToCartInput = {
  productId: string
  quantity?: number
  size?: string
  color?: string
}

/**
 * Shared "add to cart" behaviour: writes through the server action, keeps the
 * badge count in sync, and exposes a short-lived `added` flag for button copy.
 */
export function useAddToCart() {
  const { setCount } = useCart()
  const [pending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)
  const [error, setError] = useState('')

  const add = useCallback(
    (input: AddToCartInput) => {
      setError('')
      startTransition(async () => {
        const result = await addToCart(input)
        setCount(result.count)
        if (result.error) {
          setError(result.error)
          return
        }
        setAdded(true)
        window.setTimeout(() => setAdded(false), 1800)
      })
    },
    [setCount],
  )

  return { add, pending, added, error }
}
