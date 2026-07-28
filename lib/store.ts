/**
 * Shared storefront domain types.
 *
 * The catalog itself lives in the database — see `lib/products.ts` for the
 * queries that produce these shapes.
 */

export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  description: string
  sizes?: string[]
  colors?: string[]
  rating: number
  reviews: number
  inStock: boolean
  badge?: string
}

export interface CartItem {
  product: Product
  quantity: number
  size?: string
  color?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  avatar?: string
  joined: string
}

export interface Order {
  id: string
  date: string
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  items: CartItem[]
}
