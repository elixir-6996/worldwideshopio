import { HomeClient } from '@/components/home-client'
import { getHomepageProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { bestsellers, trending } = await getHomepageProducts()
  return <HomeClient bestsellers={bestsellers} trending={trending} />
}
