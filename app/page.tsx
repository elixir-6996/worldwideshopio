import { HomeClient } from '@/components/home-client'
import { getPublishedProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const products = await getPublishedProducts()

  return <HomeClient bestsellers={products.slice(0, 4)} trending={products.slice(4, 8)} />
}
