/**
 * Applies the catalog/settings migration and seeds the products table from the
 * original static catalog so the storefront keeps rendering the same items.
 * Idempotent: re-running updates nothing that already exists.
 *
 * Run: node --env-file-if-exists=/vercel/share/.env.project scripts/seed-products.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const here = dirname(fileURLToPath(import.meta.url))

// Mirrors the original PRODUCTS array from lib/store.ts.
const SEED = [
  {
    slug: 'obsidian-leather-jacket',
    name: 'Obsidian Leather Jacket',
    price: 349,
    compareAt: 499,
    category: 'Outerwear',
    description:
      'Crafted from full-grain Italian leather, this jacket features a tailored silhouette with minimal hardware for a timeless, modern aesthetic.',
    images: ['/images/product-1.png'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Dark Brown'],
    rating: 48,
    reviews: 124,
    inventory: 24,
    badge: 'Sale',
    featured: true,
  },
  {
    slug: 'cloud-runner-sneakers',
    name: 'Cloud Runner Sneakers',
    price: 195,
    category: 'Footwear',
    description:
      'Ultra-lightweight construction with a memory foam insole. A versatile everyday sneaker built for comfort without compromising on style.',
    images: ['/images/product-2.png'],
    sizes: ['6', '7', '8', '9', '10', '11', '12'],
    colors: ['White', 'Black', 'Grey'],
    rating: 46,
    reviews: 89,
    inventory: 40,
    badge: 'New',
    featured: true,
  },
  {
    slug: 'noir-chronograph-watch',
    name: 'Noir Chronograph Watch',
    price: 599,
    category: 'Accessories',
    description:
      'Swiss movement chronograph with sapphire crystal glass and a 44mm matte black case. A statement piece for the discerning collector.',
    images: ['/images/product-3.png'],
    sizes: [],
    colors: [],
    rating: 49,
    reviews: 56,
    inventory: 12,
    featured: true,
  },
  {
    slug: 'structured-leather-tote',
    name: 'Structured Leather Tote',
    price: 289,
    compareAt: 340,
    category: 'Bags',
    description:
      'Full-grain pebbled leather with a clean rectangular silhouette. Magnetic closure, interior pockets, and a removable zip pouch.',
    images: ['/images/product-4.png'],
    sizes: [],
    colors: ['Black', 'Tan', 'Burgundy'],
    rating: 47,
    reviews: 73,
    inventory: 18,
    badge: 'Sale',
    featured: true,
  },
  {
    slug: 'merino-crewneck-sweater',
    name: 'Merino Crewneck Sweater',
    price: 165,
    category: 'Tops',
    description:
      '100% extra-fine merino wool in a relaxed, versatile fit. Naturally temperature-regulating and extraordinarily soft against the skin.',
    images: ['/images/product-1.png'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Charcoal', 'Ivory', 'Navy'],
    rating: 45,
    reviews: 98,
    inventory: 30,
  },
  {
    slug: 'slim-tapered-trousers',
    name: 'Slim Tapered Trousers',
    price: 135,
    category: 'Bottoms',
    description:
      'Japanese wool-blend suiting fabric with a clean, tapered cut. Features a flat front, side seam pockets, and a concealed hook closure.',
    images: ['/images/product-2.png'],
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Black', 'Charcoal', 'Navy'],
    rating: 44,
    reviews: 61,
    inventory: 0,
    badge: 'Sold Out',
  },
  {
    slug: 'canvas-weekender-bag',
    name: 'Canvas Weekender Bag',
    price: 175,
    category: 'Bags',
    description:
      'Heavy-duty waxed canvas with leather trim. A spacious main compartment, separate shoe pocket, and padded laptop sleeve.',
    images: ['/images/product-4.png'],
    sizes: [],
    colors: ['Olive', 'Black', 'Tan'],
    rating: 46,
    reviews: 44,
    inventory: 22,
    badge: 'New',
  },
  {
    slug: 'titanium-aviator-sunglasses',
    name: 'Titanium Aviator Sunglasses',
    price: 245,
    category: 'Accessories',
    description:
      'Lightweight titanium frames with polarized lenses. Offers UV400 protection with a classic aviator silhouette refined for a modern era.',
    images: ['/images/product-3.png'],
    sizes: [],
    colors: ['Gold/Brown', 'Silver/Grey', 'Black/Green'],
    rating: 47,
    reviews: 37,
    inventory: 15,
  },
]

const DEFAULT_SETTINGS = {
  store: {
    name: 'LUXE',
    tagline: 'Modern essentials, considered design.',
    supportEmail: 'support@luxe.demo',
    currency: 'USD',
    weightUnit: 'kg',
  },
  shipping: {
    freeShippingThresholdCents: 15000,
    flatRateCents: 900,
    expressRateCents: 2500,
    processingDays: 2,
  },
  checkout: {
    taxRatePercent: 8,
    allowGuestCheckout: true,
    requirePhone: false,
  },
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set.')
    process.exit(1)
  }

  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  try {
    const sql = readFileSync(join(here, '002-products-settings.sql'), 'utf8')
    await pool.query(sql)
    console.log('Catalog + settings tables ready.')

    let inserted = 0
    for (const p of SEED) {
      const res = await pool.query(
        `INSERT INTO products
           (slug, name, description, category, price_cents, compare_at_cents,
            sku, inventory, status, badge, images, sizes, colors,
            rating, review_count, featured)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',$9,$10::jsonb,$11::jsonb,$12::jsonb,$13,$14,$15)
         ON CONFLICT (slug) DO NOTHING`,
        [
          p.slug,
          p.name,
          p.description,
          p.category,
          Math.round(p.price * 100),
          p.compareAt ? Math.round(p.compareAt * 100) : null,
          `LUXE-${p.slug.slice(0, 12).toUpperCase()}`,
          p.inventory,
          p.badge ?? null,
          JSON.stringify(p.images),
          JSON.stringify(p.sizes),
          JSON.stringify(p.colors),
          p.rating,
          p.reviews,
          p.featured ?? false,
        ],
      )
      inserted += res.rowCount ?? 0
    }
    console.log(`Products seeded: ${inserted} new, ${SEED.length - inserted} already present.`)

    for (const [section, value] of Object.entries(DEFAULT_SETTINGS)) {
      await pool.query(
        `INSERT INTO store_settings (section, value) VALUES ($1, $2::jsonb)
         ON CONFLICT (section) DO NOTHING`,
        [section, JSON.stringify(value)],
      )
    }
    console.log('Default settings ready.')

    const { rows } = await pool.query('SELECT count(*)::int AS n FROM products')
    console.log(`Total products in catalog: ${rows[0].n}`)
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Seed failed:', error.message)
  process.exit(1)
})
