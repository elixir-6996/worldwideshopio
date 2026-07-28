export type CouponDefinition = {
  id: string
  code: string
  description: string
  discountType: 'percentage' | 'fixed'
  value: number
  active: boolean
  startsAt: Date | null
  endsAt: Date | null
  usageLimit: number | null
  usageCount: number
  minimumOrderValue: number
  firstOrderOnly: boolean
  freeShipping: boolean
}

export type CouponResult = {
  valid: boolean
  code?: string
  description?: string
  message: string
  discount: number
  shippingSavings: number
}

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

export function evaluateCoupon(
  coupon: CouponDefinition | null,
  context: { subtotal: number; shipping: number; isFirstOrder: boolean; now?: Date },
): CouponResult {
  if (!coupon)
    return { valid: false, message: 'Coupon code not found.', discount: 0, shippingSavings: 0 }
  const now = context.now ?? new Date()
  if (!coupon.active)
    return { valid: false, message: 'This coupon is inactive.', discount: 0, shippingSavings: 0 }
  if (coupon.startsAt && now < coupon.startsAt)
    return {
      valid: false,
      message: 'This coupon is not active yet.',
      discount: 0,
      shippingSavings: 0,
    }
  if (coupon.endsAt && now >= coupon.endsAt)
    return { valid: false, message: 'This coupon has expired.', discount: 0, shippingSavings: 0 }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
    return {
      valid: false,
      message: 'This coupon has reached its usage limit.',
      discount: 0,
      shippingSavings: 0,
    }
  if (context.subtotal < coupon.minimumOrderValue)
    return {
      valid: false,
      message: `Minimum order value is $${coupon.minimumOrderValue}.`,
      discount: 0,
      shippingSavings: 0,
    }
  if (coupon.firstOrderOnly && !context.isFirstOrder)
    return {
      valid: false,
      message: 'This coupon is for first orders only.',
      discount: 0,
      shippingSavings: 0,
    }

  const rawDiscount =
    coupon.discountType === 'percentage'
      ? Math.round((context.subtotal * coupon.value) / 100)
      : coupon.value
  const discount = Math.min(context.subtotal, rawDiscount)
  const shippingSavings = coupon.freeShipping ? context.shipping : 0
  return {
    valid: true,
    code: coupon.code,
    description: coupon.description,
    message: coupon.description || 'Coupon applied.',
    discount,
    shippingSavings,
  }
}
