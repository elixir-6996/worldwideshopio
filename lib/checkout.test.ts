import { describe, expect, it } from 'vitest'
import {
  baseShippingFor,
  calculateTotals,
  clampQuantity,
  hydrateCart,
  toCartPayload,
  type ShippingRates,
} from './checkout'
import type { CartItem, Product } from './store'

const jacket: Product = {
  id: 'p1',
  name: 'Obsidian Leather Jacket',
  price: 349,
  originalPrice: 499,
  image: '/images/product-1.png',
  category: 'Outerwear',
  description: 'Full-grain Italian leather.',
  sizes: ['S', 'M', 'L'],
  colors: ['Black'],
  rating: 4.8,
  reviews: 124,
  inStock: true,
  badge: 'Sale',
}

const watch: Product = {
  id: 'p3',
  name: 'Noir Chronograph Watch',
  price: 599,
  image: '/images/product-3.png',
  category: 'Accessories',
  description: 'Swiss movement chronograph.',
  rating: 4.9,
  reviews: 56,
  inStock: true,
}

const cart: CartItem[] = [{ product: jacket, quantity: 1 }]

describe('cart hydration', () => {
  it('resolves payload items against the supplied catalog', () => {
    const hydrated = hydrateCart([{ productId: 'p1', quantity: 2, size: 'M' }], [jacket, watch])

    expect(hydrated).toHaveLength(1)
    expect(hydrated[0].product.name).toBe('Obsidian Leather Jacket')
    expect(hydrated[0].quantity).toBe(2)
    expect(hydrated[0].size).toBe('M')
  })

  it('drops items that are not in the catalog', () => {
    const hydrated = hydrateCart(
      [
        { productId: 'p1', quantity: 1 },
        { productId: 'deleted-product', quantity: 1 },
      ],
      [jacket, watch],
    )

    expect(hydrated.map((item) => item.product.id)).toEqual(['p1'])
  })

  it('clamps quantities into the allowed range', () => {
    expect(clampQuantity(0)).toBe(1)
    expect(clampQuantity(-5)).toBe(1)
    expect(clampQuantity(999)).toBe(10)
    expect(clampQuantity(3)).toBe(3)
  })

  it('round-trips cart lines back into a payload', () => {
    const payload = toCartPayload([{ product: watch, quantity: 2, color: 'Black' }])

    expect(payload).toEqual([{ productId: 'p3', quantity: 2, size: undefined, color: 'Black' }])
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

  it('honours shipping rates configured in store settings', () => {
    const rates: ShippingRates = {
      freeShippingThreshold: 1000,
      standardShippingRate: 25,
      expressShippingRate: 60,
    }

    expect(calculateTotals(cart, 'standard', {}, rates).shipping).toBe(25)
    expect(calculateTotals(cart, 'express', {}, rates).shipping).toBe(60)
    expect(baseShippingFor(1200, 'standard', rates)).toBe(0)
  })

  it('returns an empty subtotal and no tax for an empty cart', () => {
    const totals = calculateTotals([], 'standard')

    expect(totals.subtotal).toBe(0)
    expect(totals.discount).toBe(0)
    expect(totals.tax).toBe(0)
    expect(totals.total).toBe(totals.shipping)
  })
})
