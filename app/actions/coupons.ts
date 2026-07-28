'use server'

import { and, eq, ne, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { couponRedemptions, coupons, orders } from '@/lib/db/schema'
import { evaluateCoupon, normalizeCouponCode, type CouponDefinition } from '@/lib/coupons'

const couponSchema = z
  .object({
    id: z.string().uuid().optional(),
    code: z.string().min(2).max(32),
    description: z.string().max(160).default(''),
    discountType: z.enum(['percentage', 'fixed']),
    value: z.coerce.number().int().positive(),
    active: z.coerce.boolean().default(true),
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    usageLimit: z.coerce.number().int().positive().nullable().optional(),
    minimumOrderValue: z.coerce.number().int().min(0).default(0),
    firstOrderOnly: z.coerce.boolean().default(false),
    freeShipping: z.coerce.boolean().default(false),
  })
  .refine((value) => value.discountType !== 'percentage' || value.value <= 100, {
    message: 'Percentage discounts cannot exceed 100%.',
    path: ['value'],
  })
  .refine((value) => !value.startsAt || !value.endsAt || value.endsAt > value.startsAt, {
    message: 'End date must be after start date.',
    path: ['endsAt'],
  })

function toDefinition(row: typeof coupons.$inferSelect): CouponDefinition {
  return { ...row, discountType: row.discountType as 'percentage' | 'fixed' }
}

export async function validateCoupon(input: {
  code: string
  subtotal: number
  shipping: number
  email?: string
}) {
  const code = normalizeCouponCode(z.string().max(32).parse(input.code))
  if (!code)
    return { valid: false, message: 'Enter a coupon code.', discount: 0, shippingSavings: 0 }
  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1)
  let isFirstOrder = true
  if (input.email) {
    const email = input.email.trim().toLowerCase()
    const [existing] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.email, email), ne(orders.status, 'cancelled')))
      .limit(1)
    isFirstOrder = !existing
  }
  if (coupon?.firstOrderOnly && !input.email) {
    return {
      valid: false,
      message: 'Enter your email at checkout to use this first-order coupon.',
      discount: 0,
      shippingSavings: 0,
    }
  }
  return evaluateCoupon(coupon ? toDefinition(coupon) : null, {
    subtotal: Math.max(0, Math.round(input.subtotal)),
    shipping: Math.max(0, Math.round(input.shipping)),
    isFirstOrder,
  })
}

export async function saveCoupon(input: unknown) {
  const guard = await adminGuard()
  if (!guard.ok) throw new Error(guard.error)
  const value = couponSchema.parse(input)
  const { id, ...fields } = value
  const code = normalizeCouponCode(value.code)
  const data = {
    ...fields,
    code,
    startsAt: value.startsAt ?? null,
    endsAt: value.endsAt ?? null,
    usageLimit: value.usageLimit ?? null,
    updatedAt: new Date(),
  }
  if (id) await db.update(coupons).set(data).where(eq(coupons.id, id))
  else await db.insert(coupons).values(data)
  revalidatePath('/admin')
}

export async function deleteCoupon(id: string) {
  const guard = await adminGuard()
  if (!guard.ok) throw new Error(guard.error)
  await db.delete(coupons).where(eq(coupons.id, z.string().uuid().parse(id)))
  revalidatePath('/admin')
}

export async function redeemCoupon(input: {
  code: string
  orderId: string
  orderNumber: string
  email: string
  discount: number
  shippingSavings: number
}) {
  const code = normalizeCouponCode(input.code)
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: couponRedemptions.id })
      .from(couponRedemptions)
      .where(eq(couponRedemptions.orderId, input.orderId))
      .limit(1)
    if (existing) return

    const [coupon] = await tx
      .select()
      .from(coupons)
      .where(eq(coupons.code, code))
      .limit(1)
      .for('update')
    if (!coupon) throw new Error('Coupon no longer exists.')
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new Error('Coupon usage limit was reached before payment completed.')
    }

    await tx.insert(couponRedemptions).values({
      couponId: coupon.id,
      couponCode: code,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      customerEmail: input.email.trim().toLowerCase(),
      discountAmount: Math.max(0, Math.round(input.discount)),
      shippingSavings: Math.max(0, Math.round(input.shippingSavings)),
    })
    await tx
      .update(coupons)
      .set({ usageCount: sql`${coupons.usageCount} + 1`, updatedAt: new Date() })
      .where(eq(coupons.id, coupon.id))
  })
}
