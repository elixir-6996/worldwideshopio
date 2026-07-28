import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { paymentStatusForEvent, updateOrderFromStripeSession } from '@/lib/order-payments'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const signature = (await headers()).get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !stripe) {
    return NextResponse.json({ error: 'Payment webhook is not configured.' }, { status: 503 })
  }
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 })
  }

  const paymentStatus = paymentStatusForEvent(event)
  if (!paymentStatus) return NextResponse.json({ received: true })

  try {
    await updateOrderFromStripeSession(
      event.data.object as Stripe.Checkout.Session,
      paymentStatus,
      event.id,
    )
    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
