import { describe, expect, it } from 'vitest'
import { evaluateCoupon, normalizeCouponCode, type CouponDefinition } from './coupons'

const base: CouponDefinition = {
  id: '1',
  code: 'SAVE10',
  description: 'Save',
  discountType: 'percentage',
  value: 10,
  active: true,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  usageCount: 0,
  minimumOrderValue: 0,
  firstOrderOnly: false,
  freeShipping: false,
}
const context = {
  subtotal: 100,
  shipping: 15,
  isFirstOrder: true,
  now: new Date('2026-07-24T12:00:00Z'),
}

describe('coupon engine', () => {
  it('normalizes codes', () => expect(normalizeCouponCode(' save 10 ')).toBe('SAVE10'))
  it('calculates percentage discounts', () =>
    expect(evaluateCoupon(base, context).discount).toBe(10))
  it('calculates fixed discounts and caps at subtotal', () =>
    expect(evaluateCoupon({ ...base, discountType: 'fixed', value: 150 }, context).discount).toBe(
      100,
    ))
  it('enforces start and end dates', () => {
    expect(evaluateCoupon({ ...base, startsAt: new Date('2026-07-25') }, context).valid).toBe(false)
    expect(evaluateCoupon({ ...base, endsAt: new Date('2026-07-24') }, context).valid).toBe(false)
  })
  it('enforces minimums and usage limits', () => {
    expect(evaluateCoupon({ ...base, minimumOrderValue: 101 }, context).valid).toBe(false)
    expect(evaluateCoupon({ ...base, usageLimit: 2, usageCount: 2 }, context).valid).toBe(false)
  })
  it('enforces first order eligibility', () =>
    expect(
      evaluateCoupon({ ...base, firstOrderOnly: true }, { ...context, isFirstOrder: false }).valid,
    ).toBe(false))
  it('adds free shipping savings', () =>
    expect(evaluateCoupon({ ...base, freeShipping: true }, context).shippingSavings).toBe(15))
})
