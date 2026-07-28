'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { useCart } from '@/components/cart-provider'
import { DualPrice } from '@/components/dual-price'
import { Stepper } from '@/components/checkout/stepper'
import {
  ShippingStep,
  EMPTY_ADDRESS,
  type ShippingErrors,
} from '@/components/checkout/shipping-step'
import { DeliveryStep } from '@/components/checkout/delivery-step'
import { PaymentStep } from '@/components/checkout/payment-step'
import { ReviewStep } from '@/components/checkout/review-step'
import { OrderSummary } from '@/components/checkout/order-summary'
import { SuccessScreen } from '@/components/checkout/success-screen'
import { StripePaymentPanel } from '@/components/stripe-payment-panel'
import {
  calculateTotals,
  cartCount,
  DEFAULT_SHIPPING_RATES,
  type Address,
  type CheckoutDetails,
  type DeliveryMethod,
  type PaymentMethod,
  type ShippingRates,
} from '@/lib/checkout'
import type { CartItem } from '@/lib/store'
import { completeOrder, getSavedAddresses, saveAddress } from '@/app/actions/checkout'
import { validateCoupon } from '@/app/actions/coupons'

const STEPS = ['Shipping', 'Delivery', 'Payment', 'Review']
const STRIPE_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export function CheckoutClient({
  cart,
  rates = DEFAULT_SHIPPING_RATES,
  initialCoupon = '',
}: {
  cart: CartItem[]
  rates?: ShippingRates
  initialCoupon?: string
}) {
  const { setCount } = useCart()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const [email, setEmail] = useState('')
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS)
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [savingAddress, setSavingAddress] = useState(false)
  const [errors, setErrors] = useState<ShippingErrors>({})

  const [delivery, setDelivery] = useState<DeliveryMethod>('standard')
  const [couponInput, setCouponInput] = useState(initialCoupon)
  const [appliedCoupon, setAppliedCoupon] = useState<string>('')
  const [couponSavings, setCouponSavings] = useState({ discount: 0, shippingSavings: 0 })
  const [couponMessage, setCouponMessage] = useState('')
  const [couponError, setCouponError] = useState('')

  const [payment, setPayment] = useState<PaymentMethod>('stripe')
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState('')
  const [showStripe, setShowStripe] = useState(false)
  const [order, setOrder] = useState<{ orderNumber: string } | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)

  const totals = useMemo(
    () => calculateTotals(cart, delivery, couponSavings, rates),
    [cart, delivery, couponSavings, rates],
  )

  useEffect(() => {
    getSavedAddresses()
      .then((rows) => setSavedAddresses(rows as Address[]))
      .catch(() => setSavedAddresses([]))
  }, [])

  useEffect(() => {
    if (order) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !panelRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        panelRef.current,
        { x: direction * 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' },
      )
    })
    return () => ctx.revert()
  }, [step, order, direction])

  const details: CheckoutDetails = {
    email,
    address,
    deliveryMethod: delivery,
    paymentMethod: payment,
    coupon: appliedCoupon || undefined,
  }

  const validateShipping = () => {
    const next: ShippingErrors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email.'
    if (address.firstName.trim().length < 2) next.firstName = 'Required.'
    if (address.lastName.trim().length < 2) next.lastName = 'Required.'
    if (address.street.trim().length < 5) next.street = 'Enter your street address.'
    if (address.city.trim().length < 2) next.city = 'Required.'
    if (address.region.trim().length < 2) next.region = 'Required.'
    if (!/^[A-Za-z0-9 -]{3,12}$/.test(address.postalCode)) next.postalCode = 'Invalid postal code.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const goTo = (target: number) => {
    setDirection(target > step ? 1 : -1)
    setStep(target)
  }

  const handleNext = () => {
    if (step === 0 && !validateShipping()) return
    goTo(Math.min(step + 1, STEPS.length - 1))
  }

  const handleSaveAddress = async () => {
    if (!validateShipping()) return
    setSavingAddress(true)
    try {
      const saved = (await saveAddress(address)) as Address
      setSavedAddresses((prev) => [saved, ...prev.filter((entry) => entry.id !== saved.id)])
    } catch {
      setErrors((prev) => ({ ...prev, street: 'Could not save address. Try again.' }))
    } finally {
      setSavingAddress(false)
    }
  }

  const applyCoupon = async () => {
    const base = calculateTotals(cart, delivery, {}, rates)
    const result = await validateCoupon({
      code: couponInput,
      subtotal: base.subtotal,
      shipping: base.shipping,
      email: email || undefined,
    })
    if (result.valid && result.code) {
      setAppliedCoupon(result.code)
      setCouponSavings({ discount: result.discount, shippingSavings: result.shippingSavings })
      setCouponMessage(result.message)
      setCouponError('')
    } else {
      setAppliedCoupon('')
      setCouponSavings({ discount: 0, shippingSavings: 0 })
      setCouponMessage('')
      setCouponError(result.message)
    }
  }

  const finalizeOrder = async (paymentReference?: string) => {
    setPlacing(true)
    setPlaceError('')
    try {
      const result = await completeOrder(details, paymentReference)
      setOrder(result)
      setCount(0)
    } catch (error) {
      setPlaceError(error instanceof Error ? error.message : 'Could not place order.')
      setShowStripe(false)
    } finally {
      setPlacing(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (payment === 'stripe' && STRIPE_CONFIGURED) {
      setPlaceError('')
      setShowStripe(true)
      return
    }
    await finalizeOrder()
  }

  if (order) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <SuccessScreen orderNumber={order.orderNumber} email={email} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar cartCount={cartCount(cart)} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="flex flex-col gap-6 lg:col-span-3">
            <Link
              href="/cart"
              className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to cart
            </Link>

            <Stepper steps={STEPS} current={step} onStepClick={goTo} />

            <div ref={panelRef} className="min-h-80">
              {step === 0 && (
                <ShippingStep
                  email={email}
                  onEmailChange={setEmail}
                  address={address}
                  onAddressChange={setAddress}
                  savedAddresses={savedAddresses}
                  onSelectSaved={setAddress}
                  onSaveAddress={handleSaveAddress}
                  saving={savingAddress}
                  errors={errors}
                />
              )}
              {step === 1 && (
                <DeliveryStep
                  delivery={delivery}
                  onDeliveryChange={setDelivery}
                  coupon={couponInput}
                  onCouponInput={setCouponInput}
                  onApplyCoupon={applyCoupon}
                  couponError={couponError}
                  couponApplied={Boolean(appliedCoupon)}
                  couponMessage={couponMessage}
                />
              )}
              {step === 2 && (
                <PaymentStep value={payment} onChange={setPayment} stripeLive={STRIPE_CONFIGURED} />
              )}
              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <ReviewStep
                    email={email}
                    address={address}
                    delivery={delivery}
                    payment={payment}
                  />
                  {showStripe && payment === 'stripe' && (
                    <StripePaymentPanel details={details} onComplete={finalizeOrder} />
                  )}
                  {placeError && (
                    <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {placeError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goTo(step - 1)}
                  className="border-border"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              ) : (
                <span />
              )}

              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleNext}
                  className="bg-foreground font-medium text-background hover:bg-foreground/80"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                !showStripe && (
                  <Button
                    type="button"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="bg-brand font-medium text-brand-foreground hover:bg-brand/90"
                  >
                    {placing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                      </>
                    ) : (
                      <>
                        {payment === 'stripe' ? 'Pay securely' : 'Place order'} ·{' '}
                        <DualPrice usdCents={totals.total * 100} />
                      </>
                    )}
                  </Button>
                )
              )}
            </div>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> SSL encrypted · your details are protected.
            </p>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <OrderSummary
                cart={cart}
                totals={totals}
                coupon={appliedCoupon || undefined}
                delivery={delivery}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
