import { describe, expect, it } from 'vitest'
import { calculateTotals } from './checkout'

const cart = [{ productId: 'p1', quantity: 1 }]

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
})
