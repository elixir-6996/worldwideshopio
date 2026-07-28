import { and, eq, isNull, ne, or } from 'drizzle-orm'
import type Stripe from 'stripe'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { redeemCoupon } from '@/app/actions/coupons'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired'

function paymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === 'string'
    ? session.payment_intent
    : (session.payment_intent?.id ?? null)
}

export async function updateOrderFromStripeSession(
  session: Stripe.Checkout.Session,
  paymentStatus: PaymentStatus,
  eventId?: string,
) {
  const orderId = session.metadata?.orderId
  if (!orderId) throw new Error('Stripe session is missing order metadata.')

  const paidAt = paymentStatus === 'paid' ? new Date() : null
  const status =
    paymentStatus === 'expired' || paymentStatus === 'failed' ? 'cancelled' : 'processing'
  const eventGuard = eventId
    ? or(isNull(orders.lastStripeEventId), ne(orders.lastStripeEventId, eventId))
    : undefined

  const [order] = await db
    .update(orders)
    .set({
      paymentReference: session.id,
      paymentStatus,
      stripePaymentIntentId: paymentIntentId(session),
      lastStripeEventId: eventId ?? undefined,
      paidAt,
      paymentUpdatedAt: new Date(),
      status,
    })
    .where(eventGuard ? and(eq(orders.id, orderId), eventGuard) : eq(orders.id, orderId))
    .returning({
      id: orders.id,
      orderNumber: orders.orderNumber,
      paymentStatus: orders.paymentStatus,
      coupon: orders.coupon,
      email: orders.email,
      discount: orders.discount,
      shippingSavings: orders.shippingSavings,
    })

  if (order) {
    if (paymentStatus === 'paid' && order.coupon) {
      await redeemCoupon({
        code: order.coupon,
        orderId: order.id,
        orderNumber: order.orderNumber,
        email: order.email,
        discount: order.discount,
        shippingSavings: order.shippingSavings,
      })
    }
    return { orderNumber: order.orderNumber, paymentStatus: order.paymentStatus }
  }

  const [existing] = await db
    .select({ orderNumber: orders.orderNumber, paymentStatus: orders.paymentStatus })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!existing) throw new Error('Stripe session references an unknown order.')
  return existing
}

export function paymentStatusForEvent(event: Stripe.Event): PaymentStatus | null {
  switch (event.type) {
    case 'checkout.session.completed':
      return event.data.object.payment_status === 'paid' ? 'paid' : 'pending'
    case 'checkout.session.async_payment_succeeded':
      return 'paid'
    case 'checkout.session.async_payment_failed':
      return 'failed'
    case 'checkout.session.expired':
      return 'expired'
    default:
      return null
  }
}
