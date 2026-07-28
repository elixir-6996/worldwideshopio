import { ProductsBrowser } from '@/components/products-browser'
import { getCategories, getPublishedProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getPublishedProducts(), getCategories()])
  return <ProductsBrowser products={products} categories={categories} />
}
