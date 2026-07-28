'use server'

import { del, put } from '@vercel/blob'
import { and, eq, ne, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { products, storeSettings } from '@/lib/db/schema'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif']

const csv = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    const list = Array.isArray(value) ? value : (value ?? '').split(',')
    return [...new Set(list.map((entry) => entry.trim()).filter(Boolean))]
  })

const productSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(120),
    slug: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((value) => (value ? slugify(value) : '')),
    description: z.string().trim().max(2000).default(''),
    category: z.string().trim().min(1, 'Category is required.').max(60),
    price: z.coerce.number().int().min(1, 'Price must be at least $1.').max(1_000_000),
    originalPrice: z.coerce
      .number()
      .int()
      .max(1_000_000)
      .nullable()
      .optional()
      .transform((value) => (value && value > 0 ? value : null)),
    images: z.array(z.string().min(1)).max(8).default([]),
    sizes: csv,
    colors: csv,
    rating: z.coerce.number().min(0).max(5).default(0),
    reviews: z.coerce.number().int().min(0).default(0),
    inStock: z.coerce.boolean().default(true),
    badge: z
      .string()
      .trim()
      .max(24)
      .nullable()
      .optional()
      .transform((value) => value || null),
    status: z.enum(['draft', 'published']).default('draft'),
  })
  .refine((value) => value.originalPrice === null || value.originalPrice > value.price, {
    message: 'Compare-at price must be higher than the price.',
    path: ['originalPrice'],
  })

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

/** Finds a slug that is not already taken, ignoring the row being edited. */
async function uniqueSlug(base: string, ignoreId?: string) {
  const root = base || 'product'
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        ignoreId
          ? and(eq(products.slug, candidate), ne(products.id, ignoreId))
          : eq(products.slug, candidate),
      )
      .limit(1)
    if (!existing) return candidate
  }
  return `${root}-${Date.now()}`
}

function revalidateStorefront(slug?: string) {
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/admin')
  if (slug) revalidatePath(`/products/${slug}`)
}

export type ProductActionResult =
  | { ok: true; slug: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

/** Creates or updates a catalog row. */
export async function saveProduct(input: unknown): Promise<ProductActionResult> {
  await requireAdmin()

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    const fieldErrors = Object.fromEntries(
      Object.entries(flat.fieldErrors)
        .filter(([, messages]) => messages?.length)
        .map(([field, messages]) => [field, messages![0]]),
    )
    return {
      ok: false,
      error: flat.formErrors[0] ?? 'Please correct the highlighted fields.',
      fieldErrors,
    }
  }

  const { id, slug: requestedSlug, ...fields } = parsed.data
  const slug = await uniqueSlug(requestedSlug || slugify(fields.name), id)

  try {
    if (id) {
      await db
        .update(products)
        .set({ ...fields, slug, updatedAt: new Date() })
        .where(eq(products.id, id))
    } else {
      const [{ next } = { next: 0 }] = await db
        .select({ next: sql<number>`coalesce(max(${products.sortOrder}), 0) + 1` })
        .from(products)
      await db.insert(products).values({ ...fields, slug, sortOrder: next })
    }
  } catch (error) {
    console.error('[v0] saveProduct failed:', error)
    return { ok: false, error: 'Could not save the product. Please try again.' }
  }

  revalidateStorefront(slug)
  return { ok: true, slug }
}

/** Deletes a product and cleans up any images it owned in Blob storage. */
export async function deleteProduct(id: string): Promise<ProductActionResult> {
  await requireAdmin()
  const productId = z.string().uuid().parse(id)

  try {
    const [row] = await db
      .select({ slug: products.slug, images: products.images })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1)
    if (!row) return { ok: false, error: 'That product no longer exists.' }

    await db.delete(products).where(eq(products.id, productId))
    await removeBlobs(row.images)
    revalidateStorefront(row.slug)
    return { ok: true, slug: row.slug }
  } catch (error) {
    console.error('[v0] deleteProduct failed:', error)
    return { ok: false, error: 'Could not delete the product. Please try again.' }
  }
}

/** Toggles a product between draft and published. */
export async function setProductStatus(
  id: string,
  status: 'draft' | 'published',
): Promise<ProductActionResult> {
  await requireAdmin()
  const productId = z.string().uuid().parse(id)
  const nextStatus = z.enum(['draft', 'published']).parse(status)

  try {
    const [row] = await db
      .update(products)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning({ slug: products.slug })
    if (!row) return { ok: false, error: 'That product no longer exists.' }
    revalidateStorefront(row.slug)
    return { ok: true, slug: row.slug }
  } catch (error) {
    console.error('[v0] setProductStatus failed:', error)
    return { ok: false, error: 'Could not update the status. Please try again.' }
  }
}

/** Persists a new display order from the admin drag & drop list. */
export async function reorderProducts(ids: string[]): Promise<ProductActionResult> {
  await requireAdmin()
  const ordered = z.array(z.string().uuid()).max(500).parse(ids)

  try {
    await db.transaction(async (tx) => {
      for (const [index, id] of ordered.entries()) {
        await tx
          .update(products)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(eq(products.id, id))
      }
    })
  } catch (error) {
    console.error('[v0] reorderProducts failed:', error)
    return { ok: false, error: 'Could not save the new order. Please try again.' }
  }

  revalidateStorefront()
  return { ok: true, slug: '' }
}

export type UploadResult = { ok: true; url: string } | { ok: false; error: string }

/** Uploads one product image to Blob storage and returns its public URL. */
export async function uploadProductImage(formData: FormData): Promise<UploadResult> {
  await requireAdmin()

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose an image to upload.' }
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'Images must be PNG, JPEG, WebP, or AVIF.' }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Images must be 4MB or smaller.' }
  }

  try {
    const blob = await put(`products/${crypto.randomUUID()}-${file.name}`, file, {
      access: 'public',
      contentType: file.type,
    })
    return { ok: true, url: blob.url }
  } catch (error) {
    console.error('[v0] uploadProductImage failed:', error)
    return { ok: false, error: 'Upload failed. Please try again.' }
  }
}

/** Best-effort cleanup of Blob-hosted images; local seed paths are ignored. */
async function removeBlobs(urls: string[]) {
  const blobUrls = urls.filter((url) => url.startsWith('http'))
  if (!blobUrls.length) return
  try {
    await del(blobUrls)
  } catch (error) {
    console.error('[v0] Blob cleanup failed:', error)
  }
}

/** Removes a single image from Blob storage after it is detached from a product. */
export async function deleteProductImage(url: string): Promise<UploadResult> {
  await requireAdmin()
  await removeBlobs([z.string().min(1).parse(url)])
  return { ok: true, url }
}

const settingsSchema = z.object({
  storeName: z.string().trim().min(1).max(60),
  tagline: z.string().trim().max(160).default(''),
  supportEmail: z.union([z.literal(''), z.string().email()]).default(''),
  currency: z.string().trim().length(3).toUpperCase().default('USD'),
  freeShippingThreshold: z.coerce.number().int().min(0).max(100_000),
  standardShippingRate: z.coerce.number().int().min(0).max(100_000),
  expressShippingRate: z.coerce.number().int().min(0).max(100_000),
})

/** Upserts the single store-settings row. */
export async function saveStoreSettings(input: unknown): Promise<ProductActionResult> {
  await requireAdmin()

  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors[0] ?? 'Check the settings fields.' }
  }

  try {
    await db
      .insert(storeSettings)
      .values({ id: 'default', ...parsed.data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: storeSettings.id,
        set: { ...parsed.data, updatedAt: new Date() },
      })
  } catch (error) {
    console.error('[v0] saveStoreSettings failed:', error)
    return { ok: false, error: 'Could not save settings. Please try again.' }
  }

  revalidateStorefront()
  return { ok: true, slug: '' }
}
