/**
 * Shared domain types for the storefront.
 *
 * This module holds types only. All catalog, order and customer data is read
 * from the database (see `lib/products.ts` and `lib/db/schema.ts`).
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
