import { beforeAll, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({ db: {} }))

let paymentStatusForEvent: typeof import('./order-payments').paymentStatusForEvent

beforeAll(async () => {
  ;({ paymentStatusForEvent } = await import('./order-payments'))
})

function event(type: Stripe.Event['type'], paymentStatus = 'unpaid') {
  return {
    type,
    data: { object: { payment_status: paymentStatus } },
  } as Stripe.Event
}

describe('paymentStatusForEvent', () => {
  it('marks completed paid sessions as paid', () => {
    expect(paymentStatusForEvent(event('checkout.session.completed', 'paid'))).toBe('paid')
  })

  it('keeps incomplete completed sessions pending', () => {
    expect(paymentStatusForEvent(event('checkout.session.completed'))).toBe('pending')
  })

  it.each([
    ['checkout.session.async_payment_succeeded', 'paid'],
    ['checkout.session.async_payment_failed', 'failed'],
    ['checkout.session.expired', 'expired'],
  ] as const)('maps %s to %s', (type, expected) => {
    expect(paymentStatusForEvent(event(type))).toBe(expected)
  })

  it('ignores unrelated Stripe events', () => {
    expect(paymentStatusForEvent(event('customer.created'))).toBeNull()
  })
})
