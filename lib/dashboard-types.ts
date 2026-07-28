export interface OrderItemRecord {
  productId: string
  name: string
  price: number
  quantity: number
  size?: string
  color?: string
}

export interface OrderAddressRecord {
  label: string
  firstName: string
  lastName: string
  street: string
  city: string
  region: string
  postalCode: string
  country: string
}

export interface OrderRecord {
  id: string
  orderNumber: string
  email: string
  status: string
  paymentMethod: string
  paymentReference: string | null
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  coupon: string | null
  deliveryMethod: string
  address: OrderAddressRecord
  items: OrderItemRecord[]
  createdAt: Date
}

export interface ProfileRecord {
  email: string
  firstName: string
  lastName: string
  phone: string
  birthday: string
  createdAt: Date
}

export interface AddressRecord {
  id: string
  label: string
  firstName: string
  lastName: string
  street: string
  city: string
  region: string
  postalCode: string
  country: string
  isDefault: boolean
}

export interface WishlistRecord {
  id: string
  productId: string
  productName: string
  productImage: string
  productPrice: number
}

export interface PreferenceRecord {
  email: string
  orderUpdates: boolean
  promotions: boolean
  newArrivals: boolean
  smsUpdates: boolean
}

export interface PaymentRecord {
  id: string
  brand: string
  lastFour: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

export interface ReturnRecord {
  id: string
  orderId: string
  reason: string
  status: string
  createdAt: Date
}

/** Deterministic tracking timeline derived from an order id + status. */
export const TRACKING_STEPS = ['processing', 'shipped', 'out_for_delivery', 'delivered'] as const
export type TrackingStep = (typeof TRACKING_STEPS)[number]

export const STATUS_LABELS: Record<string, string> = {
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
