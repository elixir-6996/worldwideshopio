'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

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
