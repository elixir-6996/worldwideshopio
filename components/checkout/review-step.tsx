'use client'

import * as React from 'react'
import { CreditCard, Mail, MapPin, Truck } from 'lucide-react'
import type { Address, DeliveryMethod, PaymentMethod } from '@/lib/checkout'

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  stripe: 'Stripe (card)',
  razorpay: 'Razorpay (demo)',
  paypal: 'PayPal (demo)',
}

export function ReviewStep({
  email,
  address,
  delivery,
  payment,
}: {
  email: string
  address: Address
  delivery: DeliveryMethod
  payment: PaymentMethod
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Review & confirm</h2>
        <p className="text-sm text-muted-foreground">
          Please check everything before placing your order.
        </p>
      </div>

      <div className="grid gap-3">
        <Row icon={Mail} title="Contact" lines={[email]} />
        <Row
          icon={MapPin}
          title="Shipping to"
          lines={[
            `${address.firstName} ${address.lastName}`.trim(),
            address.street,
            `${address.city}, ${address.region} ${address.postalCode}`,
            address.country,
          ]}
        />
        <Row
          icon={Truck}
          title="Delivery"
          lines={[
            delivery === 'express' ? 'Express · 1–2 business days' : 'Standard · 5–7 business days',
          ]}
        />
        <Row icon={CreditCard} title="Payment" lines={[PAYMENT_LABELS[payment]]} />
      </div>
    </div>
  )
}

function Row({
  icon: Icon,
  title,
  lines,
}: {
  icon: React.ElementType
  title: string
  lines: string[]
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary p-4">
      <span className="rounded-lg bg-card p-2 text-brand">
        {React.createElement(Icon as React.ElementType, { className: 'h-4 w-4' })}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
        {lines.filter(Boolean).map((line, index) => (
          <p key={index} className="truncate text-sm text-foreground">
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
