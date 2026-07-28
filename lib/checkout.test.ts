import { describe, expect, it } from 'vitest'
import { calculateTotals, hydrateCart } from './checkout'
import type { Product } from './store'

const product: Product = {
  id: 'p1',
  name: 'Test Product',
  price: 100,
  image: '/images/product-1.png',
  category: 'Test',
  description: 'A product used to exercise pricing rules.',
  rating: 5,
  reviews: 1,
  inStock: true,
}

const cart = hydrateCart([{ productId: 'p1', quantity: 1 }], [product])

describe('checkout totals', () => {
  it('applies a product discount before calculating tax', () => {
    const base = calculateTotals(cart, 'standard')
    const discounted = calculateTotals(cart, 'standard', { discount: 25 })

    expect(discounted.discount).toBe(25)
    expect(discounted.tax).toBe(Math.round((base.subtotal - 25) * 0.0825))
    expect(discounted.total).toBe(
      discounted.subtotal - discounted.discount + discounted.shipping + discounted.tax,
    )
  })

  it('applies free shipping without allowing negative shipping', () => {
    const totals = calculateTotals(cart, 'express', { shippingSavings: 1000 })

    expect(totals.shipping).toBe(0)
    expect(totals.shippingSavings).toBe(30)
  })

  it('caps a fixed discount at the subtotal', () => {
    const totals = calculateTotals(cart, 'standard', { discount: Number.MAX_SAFE_INTEGER })

    expect(totals.discount).toBe(totals.subtotal)
    expect(totals.total).toBeGreaterThanOrEqual(0)
  })

  it('drops cart lines whose product left the catalog', () => {
    const hydrated = hydrateCart(
      [
        { productId: 'p1', quantity: 2 },
        { productId: 'gone', quantity: 3 },
      ],
      [product],
    )

    expect(hydrated).toHaveLength(1)
    expect(hydrated[0].quantity).toBe(2)
  })
})
