import type { Metadata } from 'next'
import { ProductsBrowser } from '@/components/products-browser'
import { getCategories, getPublishedProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'All Products',
  description: 'Browse the full catalog of curated products.',
  alternates: { canonical: '/products' },
}

/** Matches `?cat=korean-fashion` style slugs against real category names. */
function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-')
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; badge?: string; q?: string }>
}) {
  const [{ cat, badge, q }, products, categories] = await Promise.all([
    searchParams,
    getPublishedProducts(),
    getCategories(),
  ])

  const initialCategory =
    cat && cat !== 'all-categories'
      ? (categories.find((category) => slugify(category) === slugify(cat)) ?? 'All')
      : 'All'

  return (
    <ProductsBrowser
      products={products}
      categories={categories}
      initialCategory={initialCategory}
      initialBadge={badge ?? ''}
      initialQuery={q ?? ''}
    />
  )
}
