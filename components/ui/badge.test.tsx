import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Sale</Badge>)
    expect(screen.getByText('Sale')).toBeInTheDocument()
  })

  it('applies the default variant classes', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toHaveClass('bg-primary')
  })

  it('applies a chosen variant', () => {
    render(<Badge variant="outline">Draft</Badge>)
    expect(screen.getByText('Draft')).toHaveClass('text-foreground')
  })
})
