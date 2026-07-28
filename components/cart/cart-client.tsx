'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, Plus, Minus, ShoppingBag, ArrowRight, Tag, Truck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navbar'
import { DualPrice } from '@/components/dual-price'
import { Footer } from '@/components/footer'
import { useCart } from '@/components/cart-provider'
import {
  baseShipping,
  cartCount,
  cartSubtotal,
  MAX_ITEM_QUANTITY,
  type ShippingRates,
} from '@/lib/checkout'
import type { CartItem } from '@/lib/store'
import { clearCart, removeFromCart, updateCartQuantity } from '@/app/actions/cart'
import { validateCoupon } from '@/app/actions/coupons'

type AppliedPromo = {
  code: string
  message: string
  discount: number
  shippingSavings: number
  /** Subtotal the coupon was validated against; edits invalidate the coupon. */
  validatedSubtotal: number
}

function lineKey(item: CartItem) {
  return [item.product.id, item.size ?? '', item.color ?? ''].join('|')
}

export function CartClient({ cart, rates }: { cart: CartItem[]; rates: ShippingRates }) {
  const router = useRouter()
  const { setCount } = useCart()
  const [pending, startTransition] = useTransition()
  const [promoCode, setPromoCode] = useState('')
  const [promo, setPromo] = useState<AppliedPromo | null>(null)
  const [promoError, setPromoError] = useState('')

  const subtotal = useMemo(() => cartSubtotal(cart), [cart])
  const shippingBase = baseShipping(subtotal, 'standard', rates)

  useEffect(() => {
    setCount(cartCount(cart))
  }, [cart, setCount])

  // A coupon validated against an older subtotal must not survive cart edits.
  const appliedPromo = promo && promo.validatedSubtotal === subtotal ? promo : null

  const run = (action: () => Promise<{ count: number; error?: string }>) => {
    startTransition(async () => {
      const result = await action()
      setCount(result.count)
      if (result.error) setPromoError(result.error)
      router.refresh()
    })
  }

  const changeQuantity = (item: CartItem, quantity: number) =>
    run(() =>
      updateCartQuantity({
        productId: item.product.id,
        quantity: Math.max(0, Math.min(quantity, MAX_ITEM_QUANTITY)),
        size: item.size,
        color: item.color,
      }),
    )

  const applyPromo = async () => {
    const result = await validateCoupon({ code: promoCode, subtotal, shipping: shippingBase })
    if (result.valid && result.code) {
      setPromo({
        code: result.code,
        message: result.message,
        discount: result.discount,
        shippingSavings: result.shippingSavings,
        validatedSubtotal: subtotal,
      })
      setPromoError('')
    } else {
      setPromo(null)
      setPromoError(result.message)
    }
  }

  const discount = appliedPromo?.discount ?? 0
  const shipping = shippingBase - (appliedPromo?.shippingSavings ?? 0)
  const total = subtotal - discount + shipping
  const remainingForFreeShipping = Math.max(0, rates.freeShippingThreshold - subtotal)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 md:px-6 py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Your Cart</h1>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => run(clearCart)}
              disabled={pending}
            >
              Clear cart
            </Button>
          )}
        </div>

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
            {/* Cart Items */}
            <div className="lg:col-span-2 flex flex-col gap-1">
              <div className="hidden md:grid grid-cols-12 gap-4 text-xs uppercase tracking-widest text-muted-foreground pb-3 border-b border-border">
                <span className="col-span-6">Product</span>
                <span className="col-span-2 text-center">Price</span>
                <span className="col-span-2 text-center">Quantity</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              {cart.map((item) => (
                <div
                  key={lineKey(item)}
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
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        onClick={() => changeQuantity(item, item.quantity - 1)}
                        disabled={pending}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.product.name}`}
                        onClick={() => changeQuantity(item, item.quantity + 1)}
                        disabled={pending || item.quantity >= MAX_ITEM_QUANTITY}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
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
                      onClick={() =>
                        run(() =>
                          removeFromCart({
                            productId: item.product.id,
                            size: item.size,
                            color: item.color,
                          }),
                        )
                      }
                      disabled={pending}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-4 flex items-center gap-3">
                <Button
                  variant="outline"
                  asChild
                  className="border-border text-muted-foreground hover:text-foreground"
                >
                  <Link href="/products">Continue Shopping</Link>
                </Button>
                {pending && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating cart
                  </span>
                )}
              </div>
            </div>

            {/* Summary */}
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
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                          void applyPromo()
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={applyPromo}
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
                    <DualPrice usdCents={subtotal * 100} className="justify-end text-foreground" />
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between gap-4 text-brand">
                      <span>Discount ({appliedPromo?.code})</span>
                      <DualPrice usdCents={-discount * 100} className="justify-end text-brand" />
                    </div>
                  )}
                  <div className="flex justify-between gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5" /> Shipping
                    </span>
                    {shipping === 0 ? (
                      <span className="text-brand">Free</span>
                    ) : (
                      <DualPrice
                        usdCents={shipping * 100}
                        className="justify-end text-foreground"
                      />
                    )}
                  </div>
                  {remainingForFreeShipping > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Add <DualPrice usdCents={remainingForFreeShipping * 100} /> more for free
                      shipping
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Taxes are calculated at checkout.</p>
                </div>

                <Separator className="bg-border my-5" />

                <div className="flex justify-between gap-4 mb-5">
                  <span className="font-semibold text-foreground">Total</span>
                  <DualPrice
                    usdCents={total * 100}
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
