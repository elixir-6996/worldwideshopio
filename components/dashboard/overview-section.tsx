import Link from 'next/link'
import { ArrowRight, Heart, MapPin, Package, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DualPrice } from '@/components/dual-price'
import type { AddressRecord, OrderRecord, WishlistRecord } from '@/lib/dashboard-types'

interface Props {
  displayName: string
  orders: OrderRecord[]
  wishlist: WishlistRecord[]
  addresses: AddressRecord[]
  onViewOrders: () => void
  onTrackOrder: (id: string) => void
}

export function OverviewSection({
  displayName,
  orders,
  wishlist,
  addresses,
  onViewOrders,
  onTrackOrder,
}: Props) {
  const activeOrder = orders.find((order) => !['delivered', 'cancelled'].includes(order.status))
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)

  return (
    <div className="flex flex-col gap-6">
      <header data-animate className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.2em] text-brand">Private client account</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-balance">
          Welcome back, {displayName.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Your orders, preferences, and curated pieces in one place.
        </p>
      </header>

      <div data-animate className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Package, label: 'Orders', value: String(orders.length) },
          {
            icon: Truck,
            label: 'In transit',
            value: String(
              orders.filter((o) => ['shipped', 'out_for_delivery'].includes(o.status)).length,
            ),
          },
          { icon: Heart, label: 'Saved', value: String(wishlist.length) },
          { icon: MapPin, label: 'Addresses', value: String(addresses.length) },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
          >
            <Icon className="h-4 w-4 text-brand" />
            <div>
              <p className="font-serif text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {activeOrder ? (
        <section data-animate className="rounded-xl border border-brand/30 bg-card overflow-hidden">
          <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex flex-col gap-2">
              <Badge variant="outline" className="w-fit border-brand/30 text-brand capitalize">
                {activeOrder.status.replaceAll('_', ' ')}
              </Badge>
              <div>
                <p className="text-xs text-muted-foreground">Latest order</p>
                <h2 className="font-serif text-xl font-semibold">{activeOrder.orderNumber}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {activeOrder.items.length} piece{activeOrder.items.length === 1 ? '' : 's'} ·{' '}
                <DualPrice usdCents={activeOrder.total * 100} />
              </p>
            </div>
            <Button
              onClick={() => onTrackOrder(activeOrder.id)}
              className="bg-primary text-primary-foreground"
            >
              Track shipment <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-1 bg-secondary">
            <div className="h-full w-2/3 bg-primary" />
          </div>
        </section>
      ) : (
        <section data-animate className="rounded-xl border border-border bg-card p-6">
          <p className="font-serif text-xl">Your next signature piece awaits.</p>
          <Button asChild variant="outline" className="mt-4 border-border">
            <Link href="/products">Explore the collection</Link>
          </Button>
        </section>
      )}

      <section data-animate className="rounded-xl border border-border bg-card p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Lifetime portfolio</p>
            <DualPrice usdCents={totalSpent * 100} className="font-serif text-2xl font-bold" />
          </div>
          <Button variant="ghost" onClick={onViewOrders}>
            View order history <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}
