import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/app/actions/coupons', () => ({
  saveCoupon: vi.fn(),
  deleteCoupon: vi.fn(),
}))

vi.mock('@/app/actions/customer', () => ({
  signOutCustomer: vi.fn(),
}))

vi.mock('@/app/actions/products', () => ({
  saveProduct: vi.fn(),
  deleteProduct: vi.fn(),
  setProductStatus: vi.fn(),
  reorderProducts: vi.fn(),
  uploadProductImage: vi.fn(),
  deleteProductImage: vi.fn(),
  saveStoreSettings: vi.fn(),
}))

import { AdminDashboard } from '@/components/admin-dashboard'

const settings = {
  storeName: 'LUXE',
  tagline: 'Modern essentials',
  supportEmail: 'support@luxe.test',
  currency: 'USD',
  freeShippingThreshold: 200,
  standardShippingRate: 10,
  expressShippingRate: 25,
}

describe('AdminDashboard', () => {
  it('renders the stable date supplied by the server', () => {
    render(
      <AdminDashboard
        orders={[]}
        customers={[]}
        coupons={[]}
        products={[]}
        settings={settings}
        displayDate="Thursday, July 23, 2026"
        adminEmail="admin@luxe.demo"
      />,
    )

    expect(screen.getByText('Thursday, July 23, 2026')).toBeInTheDocument()
  })
})
