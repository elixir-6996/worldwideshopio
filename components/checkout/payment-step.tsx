'use client'

import * as React from 'react'
import { Check, CreditCard, Lock, Wallet } from 'lucide-react'
import type { PaymentMethod } from '@/lib/checkout'

const METHODS: {
  value: PaymentMethod
  name: string
  description: string
  live: boolean
  icon: React.ElementType
}[] = [
  {
    value: 'stripe',
    name: 'Stripe',
    description: 'Secure card payment',
    live: true,
    icon: CreditCard,
  },
  {
    value: 'razorpay',
    name: 'Razorpay',
    description: 'Demo payment flow',
    live: false,
    icon: Wallet,
  },
  { value: 'paypal', name: 'PayPal', description: 'Demo payment flow', live: false, icon: Wallet },
]

export function PaymentStep({
  value,
  onChange,
}: {
  value: PaymentMethod
  onChange: (value: PaymentMethod) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Lock className="h-4 w-4 text-brand" /> Payment method
        </h2>
        <p className="text-sm text-muted-foreground">
          Payments are encrypted and processed securely.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {METHODS.map((method) => {
          const active = method.value === value
          const Icon = method.icon
          return (
            <button
              key={method.value}
              type="button"
              onClick={() => onChange(method.value)}
              className={`flex min-h-20 items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                active
                  ? 'border-brand bg-brand/10'
                  : 'border-border bg-secondary hover:border-muted-foreground'
              }`}
            >
              <span
                className={`rounded-lg p-2.5 ${active ? 'bg-brand text-brand-foreground' : 'bg-card text-muted-foreground'}`}
              >
                {React.createElement(Icon as React.ElementType, { className: 'h-5 w-5' })}
              </span>
              <span className="flex-1">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  {method.name}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${method.live ? 'bg-brand/15 text-brand' : 'bg-muted text-muted-foreground'}`}
                  >
                    {method.live ? 'Live' : 'Demo'}
                  </span>
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {method.description}
                </span>
              </span>
              {active && <Check className="h-5 w-5 text-brand" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
