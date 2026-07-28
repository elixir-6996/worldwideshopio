'use client'

import * as React from 'react'
import { Check, Tag, Truck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DualPrice } from '@/components/dual-price'
import type { DeliveryMethod } from '@/lib/checkout'

const OPTIONS: {
  value: DeliveryMethod
  title: string
  eta: string
  priceUsdCents: number | null
  icon: React.ElementType
}[] = [
  {
    value: 'standard',
    title: 'Standard',
    eta: '5–7 business days',
    priceUsdCents: null,
    icon: Truck,
  },
  {
    value: 'express',
    title: 'Express',
    eta: '1–2 business days',
    priceUsdCents: 3000,
    icon: Zap,
  },
]

export function DeliveryStep({
  delivery,
  onDeliveryChange,
  coupon,
  onCouponInput,
  onApplyCoupon,
  couponError,
  couponApplied,
  couponMessage,
}: {
  delivery: DeliveryMethod
  onDeliveryChange: (method: DeliveryMethod) => void
  coupon: string
  onCouponInput: (value: string) => void
  onApplyCoupon: () => void
  couponError?: string
  couponApplied: boolean
  couponMessage?: string
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Delivery & Offers</h2>
        <p className="text-sm text-muted-foreground">Choose how fast you want it.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const active = delivery === option.value
          const Icon = option.icon
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onDeliveryChange(option.value)}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                active
                  ? 'border-brand bg-brand/10'
                  : 'border-border bg-secondary hover:border-muted-foreground'
              }`}
            >
              <span
                className={`rounded-lg p-2 ${active ? 'bg-brand text-brand-foreground' : 'bg-card text-muted-foreground'}`}
              >
                {React.createElement(Icon as React.ElementType, { className: 'h-4 w-4' })}
              </span>
              <span className="flex-1">
                <span className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{option.title}</span>
                  {active && <Check className="h-4 w-4 text-brand" />}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{option.eta}</span>
                <span className="mt-1 block text-sm font-medium text-foreground">
                  {option.priceUsdCents === null ? (
                    'Free on qualifying orders'
                  ) : (
                    <DualPrice usdCents={option.priceUsdCents} />
                  )}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div>
        <Label className="mb-2 flex items-center gap-1.5 text-sm text-foreground">
          <Tag className="h-3.5 w-3.5" /> Coupon code
        </Label>
        <div className="flex gap-2">
          <Input
            value={coupon}
            onChange={(event) => onCouponInput(event.target.value)}
            placeholder="Try LUXE10"
            className="bg-secondary uppercase"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault()
                onApplyCoupon()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onApplyCoupon}
            className="shrink-0 border-border"
          >
            Apply
          </Button>
        </div>
        {couponError && <p className="mt-1.5 text-xs text-destructive">{couponError}</p>}
        {couponApplied && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-brand">
            <Check className="h-3 w-3" /> {couponMessage || 'Coupon applied'}
          </p>
        )}
      </div>
    </div>
  )
}
