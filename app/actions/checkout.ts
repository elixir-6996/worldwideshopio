'use server'

import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { checkoutAddresses, orders } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { getCart, writeCartItems } from '@/lib/cart'
import { calculateTotals, type CheckoutDetails } from '@/lib/checkout'
import type { CartItem } from '@/lib/store'
import { updateOrderFromStripeSession } from '@/lib/order-payments'
import { redeemCoupon, validateCoupon } from '@/app/actions/coupons'
import { stripe } from '@/lib/stripe'

const addressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(30),
  firstName: z.string().min(2).max(60),
  lastName: z.string().min(2).max(60),
  street: z.string().min(5).max(120),
  city: z.string().min(2).max(60),
  region: z.string().min(2).max(60),
  postalCode: z.string().regex(/^[A-Za-z0-9 -]{3,12}$/),
  country: z.enum(['US', 'CA', 'GB', 'AU', 'DE']),
})

const detailsSchema = z.object({
  email: z.string().email(),
  address: addressSchema,
  deliveryMethod: z.enum(['standard', 'express']),
  paymentMethod: z.enum(['stripe', 'razorpay', 'paypal']),
  coupon: z.string().max(32).optional(),
})

async function checkoutToken(create = true) {
  const store = await cookies()
  const existing = store.get('luxe_checkout')?.value
  if (existing) return existing
  if (!create) return null
  const token = randomUUID()
  store.set('luxe_checkout', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return token
}

export async function getSavedAddresses() {
  const token = await checkoutToken(false)
  if (!token) return []
  return db
    .select()
    .from(checkoutAddresses)
    .where(eq(checkoutAddresses.checkoutToken, token))
    .orderBy(desc(checkoutAddresses.createdAt))
}

export async function saveAddress(input: CheckoutDetails['address']) {
  const address = addressSchema.parse(input)
  const token = await checkoutToken()
  if (!token) throw new Error('Unable to initialize checkout.')
  const [saved] = await db
    .insert(checkoutAddresses)
    .values({ ...address, id: undefined, checkoutToken: token })
    .returning()
  return saved
}

function orderSnapshot(cart: CartItem[]) {
  return cart.map(({ product, quantity, size, color }) => ({
    productId: product.id,
    name: product.name,
    image: product.image,
    price: product.price,
    quantity,
    size,
    color,
  }))
}

/**
 * Prices an order from the server-side cookie cart joined with live catalog
 * prices, so a tampered client payload can never change what is charged.
 */
async function priceOrder(details: CheckoutDetails) {
  const { cart, rates } = await getCart()
  if (!cart.length) throw new Error('Your cart is empty.')
  const baseTotals = calculateTotals(cart, details.deliveryMethod, {}, rates)
  const couponResult = details.coupon
    ? await validateCoupon({
        code: details.coupon,
        subtotal: baseTotals.subtotal,
        shipping: baseTotals.shipping,
        email: details.email,
      })
    : null
  if (details.coupon && !couponResult?.valid)
    throw new Error(couponResult?.message ?? 'Invalid coupon.')
  const totals = calculateTotals(cart, details.deliveryMethod, couponResult ?? {}, rates)
  return { cart, totals, couponCode: couponResult?.valid ? (couponResult.code ?? null) : null }
}

export async function startStripeCheckout(detailsInput: CheckoutDetails) {
  const details = detailsSchema.parse(detailsInput)
  if (details.paymentMethod !== 'stripe') throw new Error('Invalid payment method.')
  if (!stripe) throw new Error('Stripe is not configured. Use the demo checkout flow.')

  const token = await checkoutToken()
  if (!token) throw new Error('Unable to initialize checkout.')
  const { cart, totals, couponCode } = await priceOrder(details)
  const orderNumber = `LUX-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      checkoutToken: token,
      email: details.email,
      paymentMethod: 'stripe',
      paymentStatus: 'pending',
      ...totals,
      coupon: couponCode,
      deliveryMethod: details.deliveryMethod,
      address: details.address,
      items: orderSnapshot(cart),
    })
    .returning({ id: orders.id })

  try {
    const session = await stripe.checkout.sessions.create(
      {
        ui_mode: 'embedded_page',
        redirect_on_completion: 'never',
        mode: 'payment',
        customer_email: details.email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `LUXE order (${cart.length} item${cart.length === 1 ? '' : 's'})`,
              },
              unit_amount: totals.total * 100,
            },
            quantity: 1,
          },
        ],
        metadata: { checkoutToken: token, orderId: order.id, orderNumber },
        payment_intent_data: { metadata: { orderId: order.id, orderNumber } },
      },
      { idempotencyKey: `checkout-${order.id}` },
    )
    if (!session.client_secret) throw new Error('Stripe did not return a checkout session.')
    await db
      .update(orders)
      .set({ paymentReference: session.id, paymentUpdatedAt: new Date() })
      .where(eq(orders.id, order.id))
    return { clientSecret: session.client_secret, sessionId: session.id }
  } catch (error) {
    await db
      .update(orders)
      .set({ paymentStatus: 'failed', status: 'cancelled', paymentUpdatedAt: new Date() })
      .where(eq(orders.id, order.id))
    throw error
  }
}

export async function completeOrder(detailsInput: CheckoutDetails, paymentReference?: string) {
  const details = detailsSchema.parse(detailsInput)
  const token = await checkoutToken()
  if (!token) throw new Error('Unable to initialize checkout.')

  if (details.paymentMethod === 'stripe' && stripe) {
    if (!paymentReference) throw new Error('Missing Stripe payment reference.')
    const session = await stripe.checkout.sessions.retrieve(paymentReference)
    if (session.payment_status !== 'paid') throw new Error('Payment has not completed.')
    if (session.metadata?.checkoutToken !== token) throw new Error('Payment session mismatch.')
    const result = await updateOrderFromStripeSession(session, 'paid')
    await finishCart()
    return result
  }

  const { cart, totals, couponCode } = await priceOrder(details)
  const orderNumber = `LUX-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`
  const [paidOrder] = await db
    .insert(orders)
    .values({
      orderNumber,
      checkoutToken: token,
      email: details.email,
      paymentMethod: details.paymentMethod,
      paymentReference: `${details.paymentMethod.toUpperCase()}-DEMO-${randomUUID()}`,
      paymentStatus: 'paid',
      paidAt: new Date(),
      ...totals,
      coupon: couponCode,
      deliveryMethod: details.deliveryMethod,
      address: details.address,
      items: orderSnapshot(cart),
    })
    .returning({ id: orders.id })
  if (couponCode && paidOrder) {
    await redeemCoupon({
      code: couponCode,
      orderId: paidOrder.id,
      orderNumber,
      email: details.email,
      discount: totals.discount,
      shippingSavings: totals.shippingSavings,
    })
  }
  await finishCart()
  return { orderNumber, paymentStatus: 'paid' }
}

/** Empties the cookie cart and refreshes cart-dependent routes after an order. */
async function finishCart() {
  await writeCartItems([])
  revalidatePath('/cart')
  revalidatePath('/checkout')
}
