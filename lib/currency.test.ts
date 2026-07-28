import { describe, expect, it } from 'vitest'
import {
  FALLBACK_USD_TO_INR,
  convertUsdCentsToInrPaise,
  formatCurrency,
  formatDualCurrency,
  getCurrencyConfig,
  getGatewayCurrency,
} from './currency'

describe('currency helpers', () => {
  it('makes INR primary only for India while retaining both currencies', () => {
    const indiaPrice = formatDualCurrency(10000, getCurrencyConfig('IN', 86))
    const globalPrice = formatDualCurrency(10000, getCurrencyConfig('US', 86))

    expect(indiaPrice).toMatch(/^₹/)
    expect(indiaPrice).toContain('($100.00)')
    expect(globalPrice).toMatch(/^\$100\.00/)
    expect(globalPrice).toContain('(₹')
  })

  it('converts USD cents to INR paise', () => {
    expect(convertUsdCentsToInrPaise(100, 86)).toBe(8600)
  })

  it('formats both supported currencies', () => {
    expect(formatCurrency(12345, 'USD')).toContain('$123.45')
    expect(formatCurrency(12345, 'INR')).toContain('₹123.45')
  })

  it('maps payment gateways to settlement currencies', () => {
    expect(getGatewayCurrency('stripe')).toBe('USD')
    expect(getGatewayCurrency('paypal')).toBe('USD')
    expect(getGatewayCurrency('razorpay')).toBe('INR')
  })

  it('provides a positive fallback rate', () => {
    expect(FALLBACK_USD_TO_INR).toBeGreaterThan(0)
  })
})
