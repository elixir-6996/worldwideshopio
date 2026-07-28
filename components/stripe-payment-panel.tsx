'use client'

import { useCallback, useRef } from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { startStripeCheckout } from '@/app/actions/checkout'
import type { CartPayloadItem, CheckoutDetails } from '@/lib/checkout'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

export function StripePaymentPanel({
  items,
  details,
  onComplete,
}: {
  items: CartPayloadItem[]
  details: CheckoutDetails
  onComplete: (sessionId: string) => void
}) {
  const sessionIdRef = useRef('')
  const fetchClientSecret = useCallback(async () => {
    const result = await startStripeCheckout(items, details)
    sessionIdRef.current = result.sessionId
    return result.clientSecret
  }, [details, items])
  const handleComplete = useCallback(() => {
    if (sessionIdRef.current) onComplete(sessionIdRef.current)
  }, [onComplete])

  return (
    <div className="overflow-hidden rounded-xl bg-foreground p-1 text-background">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret, onComplete: handleComplete }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
