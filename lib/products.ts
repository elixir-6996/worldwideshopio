import 'server-only'

import { asc, eq } from 'drizzle-orm'
import { db, safeQuery } from '@/lib/db'
import { products, storeSettings } from '@/lib/db/schema'
import type { Product } from '@/lib/store'

/** A catalog row as stored in the database, including admin-only fields. */
export type ProductRow = typeof products.$inferSelect

/** Store configuration with defaults applied. */
export type StoreSettings = typeof storeSettings.$inferSelect

export const PLACEHOLDER_IMAGE = '/images/product-1.png'

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 'default',
  storeName: 'LUXE',
  tagline: 'Modern essentials, considered design.',
  supportEmail: 'support@luxe.demo',
  currency: 'USD',
  freeShippingThreshold: 200,
  standardShippingRate: 15,
  expressShippingRate: 30,
  updatedAt: new Date(0),
}

/**
 * Converts a database row into the public `Product` shape used across the
 * storefront. The public `id` is the slug so URLs and persisted cart items stay
 * stable even when a row is renamed.
 */
export function toProduct(row: ProductRow): Product {
  return {
    id: row.slug,
    name: row.name,
    price: row.price,
    originalPrice: row.originalPrice ?? undefined,
    image: row.images[0] ?? PLACEHOLDER_IMAGE,
    category: row.category,
    description: row.description,
    sizes: row.sizes.length ? row.sizes : undefined,
    colors: row.colors.length ? row.colors : undefined,
    rating: row.rating,
    reviews: row.reviews,
    inStock: row.inStock,
    badge: row.badge ?? undefined,
  }
}

/** Every published product, ordered for storefront display. */
export async function getPublishedProducts(): Promise<Product[]> {
  const rows = await safeQuery(
    'getPublishedProducts',
    () =>
      db
        .select()
        .from(products)
        .where(eq(products.status, 'published'))
        .orderBy(asc(products.sortOrder), asc(products.createdAt)),
    [] as ProductRow[],
  )
  return rows.map(toProduct)
}

/** All rows including drafts — for the admin dashboard only. */
export async function getAllProductRows(): Promise<ProductRow[]> {
  return safeQuery(
    'getAllProductRows',
    () =>
      db.select().from(products).orderBy(asc(products.sortOrder), asc(products.createdAt)),
    [] as ProductRow[],
  )
}

/** Looks up one published product by its public slug. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const rows = await safeQuery(
    'getProductBySlug',
    () => db.select().from(products).where(eq(products.slug, slug)).limit(1),
    [] as ProductRow[],
  )
  const row = rows[0]
  if (!row || row.status !== 'published') return null
  return toProduct(row)
}

/** Full image list for a product detail gallery. */
export async function getProductImages(slug: string): Promise<string[]> {
  const rows = await safeQuery(
    'getProductImages',
    () => db.select({ images: products.images }).from(products).where(eq(products.slug, slug)).limit(1),
    [] as { images: string[] }[],
  )
  return rows[0]?.images ?? []
}

/** Distinct categories present in the published catalog. */
export async function getCategories(): Promise<string[]> {
  const items = await getPublishedProducts()
  return [...new Set(items.map((item) => item.category))].sort((a, b) => a.localeCompare(b))
}

/** Store settings, falling back to defaults when unset or unreachable. */
export async function getStoreSettings(): Promise<StoreSettings> {
  const rows = await safeQuery(
    'getStoreSettings',
    () => db.select().from(storeSettings).where(eq(storeSettings.id, 'default')).limit(1),
    [] as StoreSettings[],
  )
  return rows[0] ?? DEFAULT_STORE_SETTINGS
}
