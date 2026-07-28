'use client'

import Image from 'next/image'
import { Tag, Truck } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { DualPrice } from '@/components/dual-price'
import type { CartItem } from '@/lib/store'
import type { DeliveryMethod } from '@/lib/checkout'

type Totals = {
  subtotal: number
  discount: number
  shipping: number
  shippingSavings: number
  tax: number
  total: number
}

export function OrderSummary({
  cart,
  totals,
  coupon,
  delivery,
}: {
  cart: CartItem[]
  totals: Totals
  coupon?: string
  delivery: DeliveryMethod
}) {
  const eta = delivery === 'express' ? '1–2 business days' : '5–7 business days'
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-serif text-lg font-bold text-foreground">Order Summary</h2>

      <div className="mt-5 flex flex-col gap-4">
        {cart.map((item) => (
          <div
            key={`${item.product.id}-${item.size}-${item.color}`}
            className="flex items-center gap-3"
          >
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                className="object-cover"
                sizes="56px"
              />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground text-xs font-medium text-background">
                {item.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.product.name}</p>
              <p className="text-xs text-muted-foreground">
                {[item.size, item.color].filter(Boolean).join(' · ') || item.product.category}
              </p>
            </div>
            <DualPrice
              usdCents={item.product.price * item.quantity * 100}
              className="flex-shrink-0 text-sm font-medium text-foreground"
            />
          </div>
        ))}
      </div>

      <Separator className="my-4 bg-border" />

      <div className="flex flex-col gap-2 text-sm">
        <Row label="Subtotal" value={<DualPrice usdCents={totals.subtotal * 100} />} />
        {totals.discount > 0 && (
          <Row
            label={
              <span className="flex items-center gap-1.5 text-brand">
                <Tag className="h-3.5 w-3.5" /> Discount {coupon ? `(${coupon})` : ''}
              </span>
            }
            value={
              <DualPrice usdCents={-totals.discount * 100} className="justify-end text-brand" />
            }
          />
        )}
        {totals.shippingSavings > 0 && (
          <Row
            label={<span className="text-brand">Free shipping savings</span>}
            value={<DualPrice usdCents={-totals.shippingSavings * 100} className="text-brand" />}
          />
        )}
        <Row
          label={
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" /> Shipping
            </span>
          }
          value={
            totals.shipping === 0 ? (
              <span className="text-brand">Free</span>
            ) : (
              <DualPrice usdCents={totals.shipping * 100} />
            )
          }
        />
        <Row label="Estimated tax" value={<DualPrice usdCents={totals.tax * 100} />} />
      </div>

      <Separator className="my-4 bg-border" />

      <div className="flex items-center justify-between gap-4 font-bold text-foreground">
        <span>Total</span>
        <DualPrice usdCents={totals.total * 100} className="justify-end" />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">Estimated delivery: {eta}</p>
    </div>
  )
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
