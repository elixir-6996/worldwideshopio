import 'server-only'

import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { db, safeQuery } from '@/lib/db'
import { products, storeSettings } from '@/lib/db/schema'
import type { CartItem, Product } from '@/lib/store'
import { clampQuantity, type CartPayloadItem } from '@/lib/checkout'

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

/** Every published slug — used to build the sitemap. */
export async function getPublishedSlugs(): Promise<string[]> {
  const rows = await safeQuery(
    'getPublishedSlugs',
    () =>
      db
        .select({ slug: products.slug, updatedAt: products.updatedAt })
        .from(products)
        .where(eq(products.status, 'published'))
        .orderBy(asc(products.sortOrder)),
    [] as { slug: string; updatedAt: Date }[],
  )
  return rows.map((row) => row.slug)
}

/**
 * Looks up several published products at once and returns them in the order the
 * slugs were requested. Used to hydrate carts, which reference products by the
 * public slug rather than the internal uuid.
 */
export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  const wanted = [...new Set(slugs.filter(Boolean))]
  if (!wanted.length) return []

  const rows = await safeQuery(
    'getProductsBySlugs',
    () =>
      db
        .select()
        .from(products)
        .where(and(inArray(products.slug, wanted), eq(products.status, 'published'))),
    [] as ProductRow[],
  )
  const bySlug = new Map(rows.map((row) => [row.slug, toProduct(row)]))
  return wanted.flatMap((slug) => {
    const product = bySlug.get(slug)
    return product ? [product] : []
  })
}

/**
 * Turns stored cart payload items into full cart lines using live catalog data.
 * Items whose product was deleted or unpublished are dropped, so a stale cart
 * link can never resurrect a product that is no longer for sale.
 */
export async function hydrateCartFromDatabase(items: CartPayloadItem[]): Promise<CartItem[]> {
  const catalog = await getProductsBySlugs(items.map((item) => item.productId))
  const bySlug = new Map(catalog.map((product) => [product.id, product]))
  return items.flatMap((item) => {
    const product = bySlug.get(item.productId)
    return product ? [{ ...item, product, quantity: clampQuantity(item.quantity) }] : []
  })
}

/**
 * The catalog order set in the admin panel is the merchandising order, so the
 * first published rows are the storefront's "best sellers" and the next ones
 * are "trending".
 */
export async function getHomepageProducts(): Promise<{
  bestsellers: Product[]
  trending: Product[]
}> {
  const published = await getPublishedProducts()
  return { bestsellers: published.slice(0, 4), trending: published.slice(4, 8) }
}

/** Newest published products first. */
export async function getNewArrivals(limit = 4): Promise<Product[]> {
  const rows = await safeQuery(
    'getNewArrivals',
    () =>
      db
        .select()
        .from(products)
        .where(eq(products.status, 'published'))
        .orderBy(desc(products.createdAt))
        .limit(limit),
    [] as ProductRow[],
  )
  return rows.map(toProduct)
}

/**
 * Products from the same category, falling back to the rest of the catalog when
 * a category has no other published items.
 */
export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  const published = await getPublishedProducts()
  const others = published.filter((item) => item.id !== slug)
  const current = published.find((item) => item.id === slug)
  const sameCategory = current
    ? others.filter((item) => item.category === current.category)
    : []
  return (sameCategory.length ? sameCategory : others).slice(0, limit)
}

/**
 * Seeds an empty checkout with the top of the catalog so the flow stays
 * explorable when it is opened without a cart link.
 */
export async function getDefaultCartItems(): Promise<CartPayloadItem[]> {
  const published = await getPublishedProducts()
  return published.slice(0, 2).map((product) => ({ productId: product.id, quantity: 1 }))
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
