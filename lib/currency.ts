import type { PaymentMethod } from '@/lib/checkout'

export const FALLBACK_USD_TO_INR = 86

export type DisplayCurrency = 'USD' | 'INR'

export type CurrencyConfig = {
  country: string
  primaryCurrency: DisplayCurrency
  usdToInr: number
}

export function getCurrencyConfig(
  country: string | null | undefined,
  usdToInr: number,
): CurrencyConfig {
  const normalizedCountry = country?.toUpperCase() || 'US'
  return {
    country: normalizedCountry,
    primaryCurrency: normalizedCountry === 'IN' ? 'INR' : 'USD',
    usdToInr,
  }
}

export function convertUsdCentsToInrPaise(usdCents: number, usdToInr: number) {
  return Math.round(usdCents * usdToInr)
}

export function formatCurrency(amountInMinorUnits: number, currency: DisplayCurrency) {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInMinorUnits / 100)
}

export function formatDualCurrency(usdCents: number, config: CurrencyConfig) {
  const usd = formatCurrency(usdCents, 'USD')
  const inr = formatCurrency(convertUsdCentsToInrPaise(usdCents, config.usdToInr), 'INR')
  return config.primaryCurrency === 'INR' ? `${inr} (${usd})` : `${usd} (${inr})`
}

export function getGatewayCurrency(paymentMethod: PaymentMethod): DisplayCurrency {
  return paymentMethod === 'razorpay' ? 'INR' : 'USD'
}

export async function getUsdToInrRate(): Promise<number> {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', {
      next: { revalidate: 21_600 },
      signal: AbortSignal.timeout(2500),
    })
    if (!response.ok) return FALLBACK_USD_TO_INR
    const data = (await response.json()) as { rates?: { INR?: number } }
    const rate = data.rates?.INR
    return typeof rate === 'number' && Number.isFinite(rate) && rate > 0
      ? rate
      : FALLBACK_USD_TO_INR
  } catch {
    return FALLBACK_USD_TO_INR
  }
}
