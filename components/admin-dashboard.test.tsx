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
  saveStoreSettings: vi.fn(),
}))

import { AdminDashboard } from '@/components/admin-dashboard'

const SETTINGS = {
  storeName: 'LUXE',
  tagline: 'Modern essentials',
  supportEmail: 'support@luxe.test',
  currency: 'USD',
  freeShippingThreshold: 200,
  standardShippingRate: 12,
  expressShippingRate: 28,
}

describe('AdminDashboard', () => {
  it('renders the stable date supplied by the server', () => {
    render(
      <AdminDashboard
        orders={[]}
        customers={[]}
        coupons={[]}
        products={[]}
        settings={SETTINGS}
        displayDate="Thursday, July 23, 2026"
      />,
    )

    expect(screen.getByText('Thursday, July 23, 2026')).toBeInTheDocument()
  })
})
