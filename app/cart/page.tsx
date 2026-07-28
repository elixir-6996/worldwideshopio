import { CartClient } from '@/components/cart-client'
import { getDefaultCartItems, getStoreSettings, hydrateCartFromDatabase } from '@/lib/products'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Your Cart',
  description: 'Review the items in your cart before checking out.',
}

export default async function CartPage() {
  const [items, settings] = await Promise.all([getDefaultCartItems(), getStoreSettings()])
  const initialCart = await hydrateCartFromDatabase(items)

  return <CartClient initialCart={initialCart} rates={settings} />
}
