'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Download, PackageOpen, RotateCcw, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DualPrice } from '@/components/dual-price'
import { useCurrency } from '@/components/currency-provider'
import { formatDualCurrency } from '@/lib/currency'
import { Badge } from '@/components/ui/badge'
import { requestReturn } from '@/app/actions/customer'
import type { OrderRecord, ReturnRecord } from '@/lib/dashboard-types'

const date = (value: Date) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))

export function OrdersSection({
  orders,
  returns,
  onTrackOrder,
}: {
  orders: OrderRecord[]
  returns: ReturnRecord[]
  onTrackOrder: (id: string) => void
}) {
  const [expanded, setExpanded] = useState<string | null>(orders[0]?.id ?? null)
  const [isPending, startTransition] = useTransition()
  const currency = useCurrency()
  const money = (value: number) => formatDualCurrency(value * 100, currency)

  const downloadInvoice = (order: OrderRecord) => {
    const invoice = [
      `LUXE INVOICE`,
      order.orderNumber,
      `Date: ${date(order.createdAt)}`,
      '',
      ...order.items.map(
        (item) => `${item.quantity} x ${item.name} — ${money(item.price * item.quantity)}`,
      ),
      '',
      `Subtotal: ${money(order.subtotal)}`,
      `Shipping: ${money(order.shipping)}`,
      `Tax: ${money(order.tax)}`,
      `Total: ${money(order.total)}`,
    ].join('\n')
    const blob = new Blob([invoice], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${order.orderNumber}-invoice.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div data-animate className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand">Archive</p>
          <h1 className="font-serif text-3xl font-bold">Order history</h1>
        </div>
        <span className="text-sm text-muted-foreground">{orders.length} orders</span>
      </div>
      {!orders.length && (
        <div
          data-animate
          className="rounded-xl border border-border bg-card py-16 text-center flex flex-col items-center gap-3"
        >
          <PackageOpen className="h-8 w-8 text-muted-foreground" />
          <p className="font-serif text-xl">No orders yet</p>
          <Button asChild>
            <Link href="/products">Shop the collection</Link>
          </Button>
        </div>
      )}
      {orders.map((order) => {
        const isOpen = expanded === order.id
        const hasReturn = returns.some((item) => item.orderId === order.id)
        return (
          <article
            data-animate
            key={order.id}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : order.id)}
              className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/40 transition-colors"
            >
              <div>
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Placed {date(order.createdAt)} · {order.items.length} item
                  {order.items.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-brand/30 text-brand capitalize">
                  {order.status.replaceAll('_', ' ')}
                </Badge>
                <DualPrice usdCents={order.total * 100} className="font-semibold" />
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-border p-5 flex flex-col gap-4">
                {order.items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <div>
                      <p>{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.quantity}
                        {item.size ? ` · Size ${item.size}` : ''}
                        {item.color ? ` · ${item.color}` : ''}
                      </p>
                    </div>
                    <DualPrice
                      usdCents={item.price * item.quantity * 100}
                      className="justify-end"
                    />
                  </div>
                ))}
                <div className="border-t border-border pt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Delivery</span>
                  <span className="text-right capitalize">{order.deliveryMethod}</span>
                  <span>Payment</span>
                  <span className="text-right uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!['delivered', 'cancelled'].includes(order.status) && (
                    <Button size="sm" onClick={() => onTrackOrder(order.id)}>
                      <Truck className="h-4 w-4" /> Track
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => downloadInvoice(order)}>
                    <Download className="h-4 w-4" /> Invoice
                  </Button>
                  {order.status === 'delivered' && !hasReturn && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => startTransition(() => requestReturn(order.id))}
                    >
                      <RotateCcw className="h-4 w-4" /> Request return
                    </Button>
                  )}
                  {hasReturn && <Badge variant="secondary">Return requested</Badge>}
                </div>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
