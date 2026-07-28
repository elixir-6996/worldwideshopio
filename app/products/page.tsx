import { ProductsBrowser } from '@/components/products-browser'
import { getCategories, getPublishedProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, products, categories] = await Promise.all([
    searchParams,
    getPublishedProducts(),
    getCategories(),
  ])

  return (
    <ProductsBrowser
      products={products}
      categories={categories}
      initialCategory={firstValue(params.cat)}
      initialBadge={firstValue(params.badge)}
      initialQuery={firstValue(params.q)}
      initialFilter={firstValue(params.filter)}
      maxPrice={firstValue(params.maxprice)}
    />
  )
}
