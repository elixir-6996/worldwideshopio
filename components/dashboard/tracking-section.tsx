'use client'

import { Check, Circle, MapPin, PackageCheck, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { OrderRecord } from '@/lib/dashboard-types'
import { STATUS_LABELS, TRACKING_STEPS } from '@/lib/dashboard-types'

export function TrackingSection({
  orders,
  selectedOrderId,
  onSelectOrder,
}: {
  orders: OrderRecord[]
  selectedOrderId: string | null
  onSelectOrder: (id: string) => void
}) {
  const trackable = orders.filter((order) => order.status !== 'cancelled')
  const order = trackable.find((item) => item.id === selectedOrderId) ?? trackable[0]
  if (!order)
    return (
      <div data-animate className="rounded-xl border border-border bg-card py-16 text-center">
        <Truck className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h1 className="font-serif text-2xl">No shipments to track</h1>
      </div>
    )

  const currentIndex = Math.max(
    0,
    TRACKING_STEPS.indexOf(order.status as (typeof TRACKING_STEPS)[number]),
  )
  const destination = order.address
  const eta = new Date(
    new Date(order.createdAt).getTime() + (order.deliveryMethod === 'express' ? 3 : 7) * 86400000,
  )

  return (
    <div className="flex flex-col gap-6">
      <div data-animate>
        <p className="text-xs uppercase tracking-[0.2em] text-brand">Concierge tracking</p>
        <h1 className="font-serif text-3xl font-bold">Your shipment</h1>
      </div>
      {trackable.length > 1 && (
        <div data-animate className="flex gap-2 overflow-x-auto pb-1">
          {trackable.map((item) => (
            <Button
              key={item.id}
              variant={item.id === order.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectOrder(item.id)}
            >
              {item.orderNumber}
            </Button>
          ))}
        </div>
      )}
      <section
        data-animate
        className="rounded-xl border border-border bg-card p-5 md:p-7 flex flex-col gap-7"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="border-brand/30 text-brand">
              {STATUS_LABELS[order.status] ?? order.status}
            </Badge>
            <h2 className="font-serif text-2xl mt-3">{order.orderNumber}</h2>
            <p className="text-sm text-muted-foreground">
              Estimated arrival {eta.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
          </div>
          <PackageCheck className="h-9 w-9 text-brand" />
        </div>
        <div className="flex flex-col gap-0">
          {TRACKING_STEPS.map((step, index) => {
            const complete = index <= currentIndex
            return (
              <div key={step} className="flex gap-4 min-h-20">
                <div className="flex flex-col items-center">
                  <div
                    className={`size-7 rounded-full border flex items-center justify-center ${complete ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}
                  >
                    {complete ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                  </div>
                  {index < TRACKING_STEPS.length - 1 && (
                    <div
                      className={`w-px flex-1 ${index < currentIndex ? 'bg-primary' : 'bg-border'}`}
                    />
                  )}
                </div>
                <div className="pt-1">
                  <p
                    className={
                      complete
                        ? 'text-foreground font-medium text-sm'
                        : 'text-muted-foreground text-sm'
                    }
                  >
                    {STATUS_LABELS[step]}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {index <= currentIndex
                      ? index === currentIndex
                        ? 'Current status'
                        : 'Completed'
                      : 'Pending'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="rounded-lg bg-secondary p-4 flex gap-3">
          <MapPin className="h-5 w-5 text-brand shrink-0" />
          <div className="text-sm">
            <p className="font-medium">
              Delivering to {destination.firstName} {destination.lastName}
            </p>
            <p className="text-muted-foreground mt-1">
              {destination.street}, {destination.city}, {destination.region}{' '}
              {destination.postalCode}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
