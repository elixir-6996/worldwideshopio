/**
 * Seeds the `coupons` table with a small set of promotional codes.
 *
 * Rows are keyed on the unique `code` column, so re-running is a no-op unless
 * `--force` is passed, in which case existing rows are refreshed (usage counts
 * are deliberately preserved).
 *
 * Usage:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/seed-coupons.mjs
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/seed-coupons.mjs --force
 */
import process from 'node:process'
import pg from 'pg'

const FORCE = process.argv.includes('--force')

const COUPONS = [
  {
    // Advertised as the placeholder in the checkout delivery step, so it must exist.
    code: 'LUXE10',
    description: '10% off your order.',
    discountType: 'percentage',
    value: 10,
    active: true,
    usageLimit: null,
    minimumOrderValue: 0,
    firstOrderOnly: false,
    freeShipping: false,
  },
  {
    code: 'WELCOME10',
    description: '10% off your first order.',
    discountType: 'percentage',
    value: 10,
    active: true,
    usageLimit: null,
    minimumOrderValue: 0,
    firstOrderOnly: true,
    freeShipping: false,
  },
  {
    code: 'SAVE25',
    description: '$25 off orders over $200.',
    discountType: 'fixed',
    value: 25,
    active: true,
    usageLimit: 500,
    minimumOrderValue: 200,
    firstOrderOnly: false,
    freeShipping: false,
  },
  {
    code: 'FREESHIP',
    description: 'Free standard shipping on any order.',
    discountType: 'fixed',
    value: 0,
    active: true,
    usageLimit: null,
    minimumOrderValue: 0,
    firstOrderOnly: false,
    freeShipping: true,
  },
  {
    code: 'VIP20',
    description: '20% off orders over $400.',
    discountType: 'percentage',
    value: 20,
    active: true,
    usageLimit: 100,
    minimumOrderValue: 400,
    firstOrderOnly: false,
    freeShipping: true,
  },
]

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set.')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString })
  await client.connect()

  try {
    const conflictClause = FORCE
      ? `ON CONFLICT ("code") DO UPDATE SET
           "description" = EXCLUDED."description",
           "discount_type" = EXCLUDED."discount_type",
           "value" = EXCLUDED."value",
           "active" = EXCLUDED."active",
           "usage_limit" = EXCLUDED."usage_limit",
           "minimum_order_value" = EXCLUDED."minimum_order_value",
           "first_order_only" = EXCLUDED."first_order_only",
           "free_shipping" = EXCLUDED."free_shipping",
           "updated_at" = now()`
      : 'ON CONFLICT ("code") DO NOTHING'

    let written = 0
    for (const coupon of COUPONS) {
      const result = await client.query(
        `INSERT INTO "coupons" (
           "code", "description", "discount_type", "value", "active",
           "usage_limit", "minimum_order_value", "first_order_only", "free_shipping"
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ${conflictClause}`,
        [
          coupon.code,
          coupon.description,
          coupon.discountType,
          coupon.value,
          coupon.active,
          coupon.usageLimit,
          coupon.minimumOrderValue,
          coupon.firstOrderOnly,
          coupon.freeShipping,
        ],
      )
      written += result.rowCount ?? 0
    }

    const { rows } = await client.query('SELECT count(*)::int AS total FROM "coupons"')
    console.log(`Seed complete. ${written} row(s) written, ${rows[0].total} coupon(s) available.`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
