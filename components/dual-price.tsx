'use client'

import { cn } from '@/lib/utils'
import { convertUsdCentsToInrPaise, formatCurrency } from '@/lib/currency'
import { useCurrency } from '@/components/currency-provider'

export function DualPrice({
  usdCents,
  className,
  secondaryClassName,
}: {
  usdCents: number
  className?: string
  secondaryClassName?: string
}) {
  const { primaryCurrency, usdToInr } = useCurrency()
  const usd = formatCurrency(usdCents, 'USD')
  const inr = formatCurrency(convertUsdCentsToInrPaise(usdCents, usdToInr), 'INR')
  const primary = primaryCurrency === 'INR' ? inr : usd
  const secondary = primaryCurrency === 'INR' ? usd : inr

  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-1.5', className)}>
      <span>{primary}</span>
      <span className={cn('text-[0.75em] font-normal text-muted-foreground', secondaryClassName)}>
        {secondary}
      </span>
    </span>
  )
}
