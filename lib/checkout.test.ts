import { describe, expect, it } from 'vitest'
import { DEFAULT_SHIPPING_RATES, TAX_RATE, calculateTotals, hydrateCart } from './checkout'
import type { Product } from './store'

const product: Product = {
  id: 'obsidian-leather-jacket',
  name: 'Obsidian Leather Jacket',
  price: 349,
  image: '/images/product-1.png',
  category: 'Outerwear',
  description: 'Test fixture.',
  rating: 4.8,
  reviews: 124,
  inStock: true,
}

const catalog = [product]
const payload = [{ productId: product.id, quantity: 1 }]
const cart = hydrateCart(payload, catalog)

describe('hydrateCart', () => {
  it('drops items that are not in the catalog', () => {
    expect(hydrateCart([{ productId: 'ghost', quantity: 2 }], catalog)).toEqual([])
  })

  it('caps quantities at the per-line maximum', () => {
    expect(hydrateCart([{ productId: product.id, quantity: 99 }], catalog)[0].quantity).toBe(10)
  })

  it('prices from the catalog, not the payload', () => {
    const spoofed = [{ productId: product.id, quantity: 1, price: 1 }] as never
    expect(hydrateCart(spoofed, catalog)[0].product.price).toBe(product.price)
  })
})

describe('checkout totals', () => {
  it('applies a product discount before calculating tax', () => {
    const base = calculateTotals(cart, 'standard')
    const discounted = calculateTotals(cart, 'standard', { discount: 25 })

    expect(discounted.discount).toBe(25)
    expect(discounted.tax).toBe(Math.round((base.subtotal - 25) * TAX_RATE))
    expect(discounted.total).toBe(
      discounted.subtotal - discounted.discount + discounted.shipping + discounted.tax,
    )
  })

  it('applies free shipping without allowing negative shipping', () => {
    const totals = calculateTotals(cart, 'express', { shippingSavings: 1000 })

    expect(totals.shipping).toBe(0)
    expect(totals.shippingSavings).toBe(DEFAULT_SHIPPING_RATES.expressShippingRate)
  })

  it('caps a fixed discount at the subtotal', () => {
    const totals = calculateTotals(cart, 'standard', { discount: Number.MAX_SAFE_INTEGER })

    expect(totals.discount).toBe(totals.subtotal)
    expect(totals.total).toBeGreaterThanOrEqual(0)
  })

  it('honours store-configured shipping rates', () => {
    const rates = {
      freeShippingThreshold: 100,
      standardShippingRate: 9,
      expressShippingRate: 19,
    }
    expect(calculateTotals(cart, 'standard', {}, rates).shipping).toBe(0)
    expect(calculateTotals(cart, 'express', {}, rates).shipping).toBe(19)
  })

  it('returns an empty order for an empty cart', () => {
    const totals = calculateTotals([], 'standard')
    expect(totals.subtotal).toBe(0)
    expect(totals.total).toBe(DEFAULT_SHIPPING_RATES.standardShippingRate)
  })
})
