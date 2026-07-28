import { HomeClient } from '@/components/home-client'
import { getCategories, getPublishedProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [products, categories] = await Promise.all([getPublishedProducts(), getCategories()])

  return <HomeClient products={products} categories={categories} />
}
