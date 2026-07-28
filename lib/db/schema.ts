import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  index,
  uuid,
} from 'drizzle-orm/pg-core'

/**
 * Storefront catalog. This table is the source of truth for products:
 * the storefront reads from it, and the admin dashboard writes to it.
 * Prices are stored in cents to avoid floating point drift.
 */
export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    category: text('category').notNull(),
    priceCents: integer('price_cents').notNull(),
    compareAtCents: integer('compare_at_cents'),
    sku: text('sku'),
    inventory: integer('inventory').notNull().default(0),
    status: text('status').notNull().default('draft'),
    badge: text('badge'),
    images: jsonb('images').$type<string[]>().notNull().default([]),
    sizes: jsonb('sizes').$type<string[]>().notNull().default([]),
    colors: jsonb('colors').$type<string[]>().notNull().default([]),
    rating: integer('rating').notNull().default(0),
    reviewCount: integer('review_count').notNull().default(0),
    featured: boolean('featured').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('products_status_idx').on(table.status),
    index('products_category_idx').on(table.category),
    index('products_created_at_idx').on(table.createdAt),
  ],
)

/**
 * Single-row key/value store for admin settings, keyed by section
 * ('store', 'shipping', 'payments', ...) so new sections don't need migrations.
 */
export const storeSettings = pgTable('store_settings', {
  section: text('section').primaryKey(),
  value: jsonb('value').$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const checkoutAddresses = pgTable('checkout_addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  checkoutToken: text('checkout_token').notNull(),
  label: text('label').notNull().default('Home'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  street: text('street').notNull(),
  city: text('city').notNull(),
  region: text('region').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  checkoutToken: text('checkout_token').notNull(),
  email: text('email').notNull(),
  status: text('status').notNull().default('processing'),
  paymentMethod: text('payment_method').notNull(),
  paymentReference: text('payment_reference').unique(),
  paymentStatus: text('payment_status').notNull().default('pending'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  lastStripeEventId: text('last_stripe_event_id'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  paymentUpdatedAt: timestamp('payment_updated_at', { withTimezone: true }).defaultNow().notNull(),
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  shipping: integer('shipping').notNull().default(0),
  shippingSavings: integer('shipping_savings').notNull().default(0),
  tax: integer('tax').notNull().default(0),
  total: integer('total').notNull(),
  coupon: text('coupon'),
  deliveryMethod: text('delivery_method').notNull(),
  address: jsonb('address').notNull(),
  items: jsonb('items').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull().unique(),
    description: text('description').notNull().default(''),
    discountType: text('discount_type').notNull(),
    value: integer('value').notNull(),
    active: boolean('active').notNull().default(true),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    usageLimit: integer('usage_limit'),
    usageCount: integer('usage_count').notNull().default(0),
    minimumOrderValue: integer('minimum_order_value').notNull().default(0),
    firstOrderOnly: boolean('first_order_only').notNull().default(false),
    freeShipping: boolean('free_shipping').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('coupons_active_code_idx').on(table.code)],
)

export const couponRedemptions = pgTable(
  'coupon_redemptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    couponId: uuid('coupon_id').notNull(),
    couponCode: text('coupon_code').notNull(),
    orderId: uuid('order_id').notNull().unique(),
    orderNumber: text('order_number').notNull(),
    customerEmail: text('customer_email').notNull(),
    discountAmount: integer('discount_amount').notNull().default(0),
    shippingSavings: integer('shipping_savings').notNull().default(0),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('coupon_redemptions_email_idx').on(table.customerEmail, table.redeemedAt)],
)

export const customerProfiles = pgTable('customer_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull().default(''),
  lastName: text('last_name').notNull().default(''),
  phone: text('phone').notNull().default(''),
  birthday: text('birthday').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const customerAddresses = pgTable('customer_addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  label: text('label').notNull().default('Home'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  street: text('street').notNull(),
  city: text('city').notNull(),
  region: text('region').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const customerWishlist = pgTable(
  'customer_wishlist',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    productId: text('product_id').notNull(),
    productName: text('product_name').notNull(),
    productImage: text('product_image').notNull(),
    productPrice: integer('product_price').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.email, table.productId)],
)

export const customerPreferences = pgTable('customer_preferences', {
  email: text('email').primaryKey(),
  orderUpdates: boolean('order_updates').notNull().default(true),
  promotions: boolean('promotions').notNull().default(false),
  newArrivals: boolean('new_arrivals').notNull().default(true),
  smsUpdates: boolean('sms_updates').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const customerPaymentMethods = pgTable('customer_payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  brand: text('brand').notNull(),
  lastFour: text('last_four').notNull(),
  expiryMonth: integer('expiry_month').notNull(),
  expiryYear: integer('expiry_year').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const returnRequests = pgTable('return_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  orderId: uuid('order_id').notNull(),
  reason: text('reason').notNull(),
  notes: text('notes').notNull().default(''),
  status: text('status').notNull().default('requested'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
