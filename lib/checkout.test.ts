import { describe, expect, it } from 'vitest'
import { calculateTotals, hydrateCart } from './checkout'
import type { Product } from './store'

const product: Product = {
  id: 'obsidian-jacket',
  name: 'Obsidian Leather Jacket',
  price: 349,
  image: '/images/product-1.png',
  category: 'Outerwear',
  description: 'Full-grain Italian leather with a tailored silhouette.',
  rating: 4.8,
  reviews: 124,
  inStock: true,
}

const cart = hydrateCart([{ productId: product.id, quantity: 1 }], [product])

describe('cart hydration', () => {
  it('joins persisted lines with the live catalog', () => {
    expect(cart).toHaveLength(1)
    expect(cart[0].product.price).toBe(349)
  })

  it('drops lines whose product is no longer published', () => {
    expect(hydrateCart([{ productId: 'gone', quantity: 2 }], [product])).toHaveLength(0)
  })

  it('clamps quantities into the allowed range', () => {
    const [line] = hydrateCart([{ productId: product.id, quantity: 99 }], [product])
    expect(line.quantity).toBe(10)
  })
})

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

  it('honours store-configured shipping rates', () => {
    const totals = calculateTotals(
      cart,
      'standard',
      {},
      {
        freeShippingThreshold: 100,
        standardShippingRate: 9,
        expressShippingRate: 19,
      },
    )

    expect(totals.shipping).toBe(0)
  })
})
