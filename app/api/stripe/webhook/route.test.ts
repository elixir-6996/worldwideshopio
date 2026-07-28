import { beforeEach, describe, expect, it, vi } from 'vitest'

const { constructEvent, updateOrder, headerGet } = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  updateOrder: vi.fn(),
  headerGet: vi.fn(),
}))

vi.mock('next/headers', () => ({ headers: async () => ({ get: headerGet }) }))
vi.mock('@/lib/stripe', () => ({ stripe: { webhooks: { constructEvent } } }))
vi.mock('@/lib/order-payments', () => ({
  paymentStatusForEvent: () => 'paid',
  updateOrderFromStripeSession: updateOrder,
}))

import { POST } from './route'

describe('Stripe webhook route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_live'
    headerGet.mockReturnValue('valid-signature')
  })

  it('fails closed when webhook credentials are missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    headerGet.mockReturnValue(null)
    const response = await POST(new Request('https://example.com', { method: 'POST', body: '{}' }))
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: 'Payment webhook is not configured.' })
    expect(constructEvent).not.toHaveBeenCalled()
  })

  it('rejects an invalid Stripe signature', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })
    const response = await POST(new Request('https://example.com', { method: 'POST', body: '{}' }))
    expect(response.status).toBe(400)
    expect(updateOrder).not.toHaveBeenCalled()
  })

  it('processes a verified event once through the idempotent updater', async () => {
    const session = { id: 'cs_live_123', metadata: { orderId: 'order-id' } }
    constructEvent.mockReturnValue({
      id: 'evt_live_123',
      type: 'checkout.session.completed',
      data: { object: session },
    })
    const response = await POST(new Request('https://example.com', { method: 'POST', body: '{}' }))
    expect(response.status).toBe(200)
    expect(updateOrder).toHaveBeenCalledWith(session, 'paid', 'evt_live_123')
  })

  it('returns a retryable error when order synchronization fails', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_live_456',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_live_456' } },
    })
    updateOrder.mockRejectedValue(new Error('Database unavailable'))
    const response = await POST(new Request('https://example.com', { method: 'POST', body: '{}' }))
    expect(response.status).toBe(500)
  })
})
