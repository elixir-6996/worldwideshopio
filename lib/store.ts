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

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Obsidian Leather Jacket',
    price: 349,
    originalPrice: 499,
    image: '/images/product-1.png',
    category: 'Outerwear',
    description:
      'Crafted from full-grain Italian leather, this jacket features a tailored silhouette with minimal hardware for a timeless, modern aesthetic.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Dark Brown'],
    rating: 4.8,
    reviews: 124,
    inStock: true,
    badge: 'Sale',
  },
  {
    id: 'p2',
    name: 'Cloud Runner Sneakers',
    price: 195,
    image: '/images/product-2.png',
    category: 'Footwear',
    description:
      'Ultra-lightweight construction with a memory foam insole. A versatile everyday sneaker built for comfort without compromising on style.',
    sizes: ['6', '7', '8', '9', '10', '11', '12'],
    colors: ['White', 'Black', 'Grey'],
    rating: 4.6,
    reviews: 89,
    inStock: true,
    badge: 'New',
  },
  {
    id: 'p3',
    name: 'Noir Chronograph Watch',
    price: 599,
    image: '/images/product-3.png',
    category: 'Accessories',
    description:
      'Swiss movement chronograph with sapphire crystal glass and a 44mm matte black case. A statement piece for the discerning collector.',
    rating: 4.9,
    reviews: 56,
    inStock: true,
  },
  {
    id: 'p4',
    name: 'Structured Leather Tote',
    price: 289,
    originalPrice: 340,
    image: '/images/product-4.png',
    category: 'Bags',
    description:
      'Full-grain pebbled leather with a clean rectangular silhouette. Magnetic closure, interior pockets, and a removable zip pouch.',
    colors: ['Black', 'Tan', 'Burgundy'],
    rating: 4.7,
    reviews: 73,
    inStock: true,
    badge: 'Sale',
  },
  {
    id: 'p5',
    name: 'Merino Crewneck Sweater',
    price: 165,
    image: '/images/product-1.png',
    category: 'Tops',
    description:
      '100% extra-fine merino wool in a relaxed, versatile fit. Naturally temperature-regulating and extraordinarily soft against the skin.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Charcoal', 'Ivory', 'Navy'],
    rating: 4.5,
    reviews: 98,
    inStock: true,
  },
  {
    id: 'p6',
    name: 'Slim Tapered Trousers',
    price: 135,
    image: '/images/product-2.png',
    category: 'Bottoms',
    description:
      'Japanese wool-blend suiting fabric with a clean, tapered cut. Features a flat front, side seam pockets, and a concealed hook closure.',
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Black', 'Charcoal', 'Navy'],
    rating: 4.4,
    reviews: 61,
    inStock: false,
    badge: 'Sold Out',
  },
  {
    id: 'p7',
    name: 'Canvas Weekender Bag',
    price: 175,
    image: '/images/product-4.png',
    category: 'Bags',
    description:
      'Heavy-duty waxed canvas with leather trim. A spacious main compartment, separate shoe pocket, and padded laptop sleeve.',
    colors: ['Olive', 'Black', 'Tan'],
    rating: 4.6,
    reviews: 44,
    inStock: true,
    badge: 'New',
  },
  {
    id: 'p8',
    name: 'Titanium Aviator Sunglasses',
    price: 245,
    image: '/images/product-3.png',
    category: 'Accessories',
    description:
      'Lightweight titanium frames with polarized lenses. Offers UV400 protection with a classic aviator silhouette refined for a modern era.',
    colors: ['Gold/Brown', 'Silver/Grey', 'Black/Green'],
    rating: 4.7,
    reviews: 37,
    inStock: true,
  },
]

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2024-001',
    date: 'Jul 12, 2025',
    status: 'delivered',
    total: 544,
    items: [
      { product: PRODUCTS[0], quantity: 1, size: 'M', color: 'Black' },
      { product: PRODUCTS[1], quantity: 1, size: '10', color: 'White' },
    ],
  },
  {
    id: 'ORD-2024-002',
    date: 'Jun 28, 2025',
    status: 'shipped',
    total: 599,
    items: [{ product: PRODUCTS[2], quantity: 1 }],
  },
  {
    id: 'ORD-2024-003',
    date: 'Jun 3, 2025',
    status: 'delivered',
    total: 289,
    items: [{ product: PRODUCTS[3], quantity: 1, color: 'Black' }],
  },
]

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex Morgan',
  email: 'alex.morgan@email.com',
  role: 'user',
  joined: 'January 2024',
}

export const MOCK_ADMIN: User = {
  id: 'a1',
  name: 'Jordan Lee',
  email: 'admin@luxe.com',
  role: 'admin',
  joined: 'March 2023',
}
