'use client'

import { useMemo, useRef, useState } from 'react'
import { useTransition } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  ChevronRight,
  CreditCard,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Truck,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { signOutCustomer } from '@/app/actions/customer'
import type {
  AddressRecord,
  OrderRecord,
  PaymentRecord,
  PreferenceRecord,
  ProfileRecord,
  ReturnRecord,
  WishlistRecord,
} from '@/lib/dashboard-types'
import { OverviewSection } from '@/components/dashboard/overview-section'
import { OrdersSection } from '@/components/dashboard/orders-section'
import { TrackingSection } from '@/components/dashboard/tracking-section'
import { AccountSection } from '@/components/dashboard/account-section'

export type DashboardTab = 'overview' | 'orders' | 'tracking' | 'account'

const NAV_ITEMS: { icon: LucideIcon; label: string; tab: DashboardTab }[] = [
  { icon: LayoutDashboard, label: 'Overview', tab: 'overview' },
  { icon: Package, label: 'Orders', tab: 'orders' },
  { icon: Truck, label: 'Tracking', tab: 'tracking' },
  { icon: User, label: 'Account', tab: 'account' },
]

interface DashboardClientProps {
  profile: ProfileRecord
  orders: OrderRecord[]
  addresses: AddressRecord[]
  wishlist: WishlistRecord[]
  preferences: PreferenceRecord
  payments: PaymentRecord[]
  returns: ReturnRecord[]
}

export function DashboardClient(props: DashboardClientProps) {
  const { profile, orders } = props
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(orders[0]?.id ?? null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isSigningOut, startSignOut] = useTransition()
  const contentRef = useRef<HTMLDivElement>(null)

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email.split('@')[0]
  const initials = useMemo(() => {
    const parts = displayName.split(' ').filter(Boolean)
    return (parts[0]?.[0] ?? 'L').concat(parts[1]?.[0] ?? '').toUpperCase()
  }, [displayName])

  useGSAP(
    () => {
      if (!contentRef.current) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.fromTo(
        contentRef.current.querySelectorAll('[data-animate]'),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' },
      )
    },
    { dependencies: [activeTab], scope: contentRef },
  )

  const goToTracking = (orderId: string) => {
    setTrackingOrderId(orderId)
    setActiveTab('tracking')
  }

  const renderNavList = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1" aria-label="Account sections">
      {NAV_ITEMS.map(({ icon: Icon, label, tab }) => (
        <button
          key={tab}
          onClick={() => {
            setActiveTab(tab)
            onNavigate?.()
          }}
          aria-current={activeTab === tab ? 'page' : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
            activeTab === tab
              ? 'bg-secondary text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          }`}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {label}
        </button>
      ))}
    </nav>
  )

  const renderSidebarCard = (onNavigate?: () => void) => (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Avatar className="size-12 border border-border">
          <AvatarFallback className="bg-brand/20 text-brand font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
        </div>
      </div>
      <Separator className="bg-border" />
      {renderNavList(onNavigate)}
      <Separator className="bg-border" />
      <Button
        variant="ghost"
        size="sm"
        disabled={isSigningOut}
        onClick={() => startSignOut(() => signOutCustomer())}
        className="justify-start text-muted-foreground hover:text-destructive w-full gap-2 px-3"
      >
        <LogOut className="h-4 w-4" />
        {isSigningOut ? 'Signing out...' : 'Sign Out'}
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={0} isLoggedIn />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 md:px-6 py-8 md:py-10">
        <div className="flex items-center justify-between gap-4 mb-6 md:hidden">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">My Account</p>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Hello, {displayName.split(' ')[0]}
            </h1>
          </div>
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="border-border gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-background border-border p-4">
              <SheetTitle className="sr-only">Account navigation</SheetTitle>
              {renderSidebarCard(() => setMobileNavOpen(false))}
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="hidden md:block md:col-span-1">
            <div className="sticky top-24">{renderSidebarCard()}</div>
          </aside>

          <div ref={contentRef} className="md:col-span-3">
            {activeTab === 'overview' && (
              <OverviewSection
                displayName={displayName}
                orders={props.orders}
                wishlist={props.wishlist}
                addresses={props.addresses}
                onViewOrders={() => setActiveTab('orders')}
                onTrackOrder={goToTracking}
              />
            )}
            {activeTab === 'orders' && (
              <OrdersSection
                orders={props.orders}
                returns={props.returns}
                onTrackOrder={goToTracking}
              />
            )}
            {activeTab === 'tracking' && (
              <TrackingSection
                orders={props.orders}
                selectedOrderId={trackingOrderId}
                onSelectOrder={setTrackingOrderId}
              />
            )}
            {activeTab === 'account' && (
              <AccountSection
                profile={props.profile}
                addresses={props.addresses}
                preferences={props.preferences}
                payments={props.payments}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const DASHBOARD_ICONS = { Bell, ChevronRight, CreditCard, Heart, MapPin }
export { Link }
