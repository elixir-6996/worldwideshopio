'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Plus, Minus, ShoppingBag, ArrowRight, Tag, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navbar'
import { DualPrice } from '@/components/dual-price'
import { Footer } from '@/components/footer'
import { useCart } from '@/hooks/use-cart'
import { cartLineKey, type CartPayloadItem } from '@/lib/cart'
import { calculateTotals, hydrateCart, type ShippingRates } from '@/lib/checkout'
import type { Product } from '@/lib/store'
import { validateCoupon } from '@/app/actions/coupons'

type AppliedPromo = {
  code: string
  message: string
  discount: number
  shippingSavings: number
}

export function CartClient({
  initialItems,
  catalog,
  rates,
}: {
  initialItems: CartPayloadItem[]
  catalog: Product[]
  rates: ShippingRates
}) {
  const { items, count, updateQuantity, remove } = useCart(initialItems)
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)
  const [promoError, setPromoError] = useState('')
  const [applying, setApplying] = useState(false)

  const cart = useMemo(() => hydrateCart(items, catalog), [items, catalog])
  const totals = useMemo(
    () =>
      calculateTotals(
        cart,
        'standard',
        {
          discount: appliedPromo?.discount ?? 0,
          shippingSavings: appliedPromo?.shippingSavings ?? 0,
        },
        rates,
      ),
    [cart, appliedPromo, rates],
  )

  const applyPromo = async () => {
    if (!promoCode.trim() || applying) return
    setApplying(true)
    try {
      const base = calculateTotals(cart, 'standard', {}, rates)
      const result = await validateCoupon({
        code: promoCode,
        subtotal: base.subtotal,
        shipping: base.shipping,
      })
      if (result.valid && result.code) {
        setAppliedPromo({
          code: result.code,
          message: result.message,
          discount: result.discount,
          shippingSavings: result.shippingSavings,
        })
        setPromoError('')
      } else {
        setAppliedPromo(null)
        setPromoError(result.message)
      }
    } catch {
      setAppliedPromo(null)
      setPromoError('Could not check that code. Try again.')
    } finally {
      setApplying(false)
    }
  }

  const remainingForFreeShipping = Math.max(0, rates.freeShippingThreshold - totals.subtotal)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={count} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 md:px-6 py-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-8">
          Your Cart
        </h1>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
            <p className="text-muted-foreground text-lg">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Add some products to get started</p>
            <Button asChild className="mt-2 bg-foreground text-background hover:bg-foreground/80">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 flex flex-col gap-1">
              <div className="hidden md:grid grid-cols-12 gap-4 text-xs uppercase tracking-widest text-muted-foreground pb-3 border-b border-border">
                <span className="col-span-6">Product</span>
                <span className="col-span-2 text-center">Price</span>
                <span className="col-span-2 text-center">Quantity</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              {cart.map((item) => {
                const key = cartLineKey({
                  productId: item.product.id,
                  size: item.size,
                  color: item.color,
                })
                return (
                  <div
                    key={key}
                    className="grid grid-cols-12 gap-4 py-6 border-b border-border items-center"
                  >
                    <div className="col-span-12 md:col-span-6 flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product.id}`}
                          className="text-sm font-medium text-foreground hover:text-brand transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.product.category}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.size && (
                            <Badge
                              variant="outline"
                              className="text-xs border-border text-muted-foreground h-5"
                            >
                              {item.size}
                            </Badge>
                          )}
                          {item.color && (
                            <Badge
                              variant="outline"
                              className="text-xs border-border text-muted-foreground h-5"
                            >
                              {item.color}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex md:col-span-2 justify-center">
                      <DualPrice
                        usdCents={item.product.price * 100}
                        className="text-sm text-foreground"
                      />
                    </div>

                    <div className="col-span-7 md:col-span-2 flex items-center justify-start md:justify-center gap-2">
                      <div className="flex items-center border border-border rounded-md">
                        <button
                          type="button"
                          onClick={() => updateQuantity(key, -1)}
                          aria-label={`Decrease quantity of ${item.product.name}`}
                          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(key, 1)}
                          aria-label={`Increase quantity of ${item.product.name}`}
                          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="col-span-5 md:col-span-2 flex items-center justify-end gap-3">
                      <DualPrice
                        usdCents={item.product.price * item.quantity * 100}
                        className="text-sm font-semibold text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => remove(key)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}

              <div className="pt-4">
                <Button
                  variant="outline"
                  asChild
                  className="border-border text-muted-foreground hover:text-foreground"
                >
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
                <h2 className="font-serif text-xl font-bold text-foreground mb-5">Order Summary</h2>

                <div className="mb-5">
                  <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> Promo Code
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter code"
                      aria-label="Promo code"
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 text-sm uppercase"
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Enter' &&
                          !e.nativeEvent.isComposing &&
                          e.keyCode !== 229
                        ) {
                          e.preventDefault()
                          void applyPromo()
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={applyPromo}
                      disabled={applying}
                      className="border-border h-9 shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                  {promoError && <p className="text-xs text-destructive mt-1.5">{promoError}</p>}
                  {appliedPromo && (
                    <p className="text-xs text-brand mt-1.5 flex items-center gap-1">
                      <span className="font-medium">{appliedPromo.code}</span> —{' '}
                      {appliedPromo.message}
                    </p>
                  )}
                </div>

                <Separator className="bg-border mb-5" />

                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between gap-4 text-muted-foreground">
                    <span>Subtotal</span>
                    <DualPrice
                      usdCents={totals.subtotal * 100}
                      className="justify-end text-foreground"
                    />
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between gap-4 text-brand">
                      <span>Discount ({appliedPromo?.code})</span>
                      <DualPrice
                        usdCents={-totals.discount * 100}
                        className="justify-end text-brand"
                      />
                    </div>
                  )}
                  <div className="flex justify-between gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5" /> Shipping
                    </span>
                    {totals.shipping === 0 ? (
                      <span className="text-brand">Free</span>
                    ) : (
                      <DualPrice
                        usdCents={totals.shipping * 100}
                        className="justify-end text-foreground"
                      />
                    )}
                  </div>
                  <div className="flex justify-between gap-4 text-muted-foreground">
                    <span>Estimated tax</span>
                    <DualPrice usdCents={totals.tax * 100} className="justify-end text-foreground" />
                  </div>
                  {remainingForFreeShipping > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Add <DualPrice usdCents={remainingForFreeShipping * 100} /> more for free
                      shipping
                    </p>
                  )}
                </div>

                <Separator className="bg-border my-5" />

                <div className="flex justify-between gap-4 mb-5">
                  <span className="font-semibold text-foreground">Total</span>
                  <DualPrice
                    usdCents={totals.total * 100}
                    className="justify-end text-lg font-bold text-foreground"
                  />
                </div>

                <Button
                  asChild
                  className="w-full bg-foreground text-background hover:bg-foreground/80 font-medium"
                  size="lg"
                >
                  <Link
                    href={
                      appliedPromo
                        ? `/checkout?coupon=${encodeURIComponent(appliedPromo.code)}`
                        : '/checkout'
                    }
                  >
                    Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  Secure checkout · SSL encrypted
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
