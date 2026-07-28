import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/app/actions/coupons', () => ({
  saveCoupon: vi.fn(),
  deleteCoupon: vi.fn(),
}))

import { AdminDashboard } from '@/components/admin-dashboard'

describe('AdminDashboard', () => {
  it('renders the stable date supplied by the server', () => {
    render(
      <AdminDashboard
        orders={[]}
        customers={[]}
        coupons={[]}
        displayDate="Thursday, July 23, 2026"
      />,
    )

    expect(screen.getByText('Thursday, July 23, 2026')).toBeInTheDocument()
  })
})
