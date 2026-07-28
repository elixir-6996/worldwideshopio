/**
 * Seeds the `products` table with the original static catalog.
 *
 * Slugs match the legacy identifiers (p1…p8) so existing /products/[id] links,
 * sitemap entries and the default cart keep resolving. Rows are upserted, so
 * running the script twice will not duplicate the catalog. Existing rows keep
 * any edits made in the admin panel except for the fields listed in the
 * ON CONFLICT clause being refreshed only when `--force` is passed.
 *
 * Usage:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/seed-products.mjs
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/seed-products.mjs --force
 */
import process from 'node:process'
import pg from 'pg'

const FORCE = process.argv.includes('--force')

const PRODUCTS = [
  {
    slug: 'p1',
    name: 'Obsidian Leather Jacket',
    price: 349,
    originalPrice: 499,
    images: ['/images/product-1.png'],
    category: 'Outerwear',
    description:
      'Crafted from full-grain Italian leather, this jacket features a tailored silhouette with minimal hardware for a timeless, modern aesthetic.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Dark Brown'],
    rating: 4.8,
    reviews: 124,
    inStock: true,
    badge: 'Sale',
  },
  {
    slug: 'p2',
    name: 'Cloud Runner Sneakers',
    price: 195,
    originalPrice: null,
    images: ['/images/product-2.png'],
    category: 'Footwear',
    description:
      'Ultra-lightweight construction with a memory foam insole. A versatile everyday sneaker built for comfort without compromising on style.',
    sizes: ['6', '7', '8', '9', '10', '11', '12'],
    colors: ['White', 'Black', 'Grey'],
    rating: 4.6,
    reviews: 89,
    inStock: true,
    badge: 'New',
  },
  {
    slug: 'p3',
    name: 'Noir Chronograph Watch',
    price: 599,
    originalPrice: null,
    images: ['/images/product-3.png'],
    category: 'Accessories',
    description:
      'Swiss movement chronograph with sapphire crystal glass and a 44mm matte black case. A statement piece for the discerning collector.',
    sizes: [],
    colors: [],
    rating: 4.9,
    reviews: 56,
    inStock: true,
    badge: null,
  },
  {
    slug: 'p4',
    name: 'Structured Leather Tote',
    price: 289,
    originalPrice: 340,
    images: ['/images/product-4.png'],
    category: 'Bags',
    description:
      'Full-grain pebbled leather with a clean rectangular silhouette. Magnetic closure, interior pockets, and a removable zip pouch.',
    sizes: [],
    colors: ['Black', 'Tan', 'Burgundy'],
    rating: 4.7,
    reviews: 73,
    inStock: true,
    badge: 'Sale',
  },
  {
    slug: 'p5',
    name: 'Merino Crewneck Sweater',
    price: 165,
    originalPrice: null,
    images: ['/images/product-1.png'],
    category: 'Tops',
    description:
      '100% extra-fine merino wool in a relaxed, versatile fit. Naturally temperature-regulating and extraordinarily soft against the skin.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Charcoal', 'Ivory', 'Navy'],
    rating: 4.5,
    reviews: 98,
    inStock: true,
    badge: null,
  },
  {
    slug: 'p6',
    name: 'Slim Tapered Trousers',
    price: 135,
    originalPrice: null,
    images: ['/images/product-2.png'],
    category: 'Bottoms',
    description:
      'Japanese wool-blend suiting fabric with a clean, tapered cut. Features a flat front, side seam pockets, and a concealed hook closure.',
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Black', 'Charcoal', 'Navy'],
    rating: 4.4,
    reviews: 61,
    inStock: false,
    badge: 'Sold Out',
  },
  {
    slug: 'p7',
    name: 'Canvas Weekender Bag',
    price: 175,
    originalPrice: null,
    images: ['/images/product-4.png'],
    category: 'Bags',
    description:
      'Heavy-duty waxed canvas with leather trim. A spacious main compartment, separate shoe pocket, and padded laptop sleeve.',
    sizes: [],
    colors: ['Olive', 'Black', 'Tan'],
    rating: 4.6,
    reviews: 44,
    inStock: true,
    badge: 'New',
  },
  {
    slug: 'p8',
    name: 'Titanium Aviator Sunglasses',
    price: 245,
    originalPrice: null,
    images: ['/images/product-3.png'],
    category: 'Accessories',
    description:
      'Lightweight titanium frames with polarized lenses. Offers UV400 protection with a classic aviator silhouette refined for a modern era.',
    sizes: [],
    colors: ['Gold/Brown', 'Silver/Grey', 'Black/Green'],
    rating: 4.7,
    reviews: 37,
    inStock: true,
    badge: null,
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
      ? `ON CONFLICT ("slug") DO UPDATE SET
           "name" = EXCLUDED."name",
           "description" = EXCLUDED."description",
           "category" = EXCLUDED."category",
           "price" = EXCLUDED."price",
           "original_price" = EXCLUDED."original_price",
           "images" = EXCLUDED."images",
           "sizes" = EXCLUDED."sizes",
           "colors" = EXCLUDED."colors",
           "rating" = EXCLUDED."rating",
           "reviews" = EXCLUDED."reviews",
           "in_stock" = EXCLUDED."in_stock",
           "badge" = EXCLUDED."badge",
           "status" = EXCLUDED."status",
           "sort_order" = EXCLUDED."sort_order",
           "updated_at" = now()`
      : 'ON CONFLICT ("slug") DO NOTHING'

    let inserted = 0
    for (const [index, product] of PRODUCTS.entries()) {
      const result = await client.query(
        `INSERT INTO "products" (
           "slug", "name", "description", "category", "price", "original_price",
           "images", "sizes", "colors", "rating", "reviews", "in_stock",
           "badge", "status", "sort_order"
         ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12,$13,'published',$14)
         ${conflictClause}`,
        [
          product.slug,
          product.name,
          product.description,
          product.category,
          product.price,
          product.originalPrice,
          JSON.stringify(product.images),
          JSON.stringify(product.sizes),
          JSON.stringify(product.colors),
          product.rating,
          product.reviews,
          product.inStock,
          product.badge,
          index,
        ],
      )
      inserted += result.rowCount ?? 0
    }

    const { rows } = await client.query('SELECT count(*)::int AS total FROM "products"')
    console.log(
      `Seed complete. ${inserted} row(s) written, ${rows[0].total} product(s) in the catalog.`,
    )
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
