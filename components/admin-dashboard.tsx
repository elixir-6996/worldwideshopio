'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronRight,
  Plus,
  ArrowUpRight,
  TicketPercent,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { signOutCustomer } from '@/app/actions/customer'
import { type Order } from '@/lib/store'
import { AdminCoupons, type AdminCoupon } from '@/components/admin-coupons'
import { AdminProducts, type AdminProduct } from '@/components/admin-products'
import { AdminSettings, type AdminStoreSettings } from '@/components/admin-settings'

type AdminCustomer = {
  id: string
  name: string
  email: string
  orders: number
  spent: number
  status: string
}

type Tab = 'overview' | 'products' | 'orders' | 'customers' | 'coupons' | 'settings'

const STATUS_STYLES: Record<string, string> = {
  delivered: 'bg-brand/20 text-brand border-0',
  shipped: 'bg-blue-500/20 text-blue-400 border-0',
  processing: 'bg-yellow-500/20 text-yellow-400 border-0',
  cancelled: 'bg-destructive/20 text-destructive border-0',
}

const NAV_ITEMS: { icon: LucideIcon; label: string; tab: Tab }[] = [
  { icon: LayoutDashboard, label: 'Overview', tab: 'overview' },
  { icon: Package, label: 'Products', tab: 'products' },
  { icon: ShoppingCart, label: 'Orders', tab: 'orders' },
  { icon: Users, label: 'Customers', tab: 'customers' },
  { icon: TicketPercent, label: 'Coupons', tab: 'coupons' },
]

export function AdminDashboard({
  orders,
  customers,
  coupons,
  products,
  settings,
  displayDate,
  adminEmail,
}: {
  orders: Order[]
  customers: AdminCustomer[]
  coupons: AdminCoupon[]
  products: AdminProduct[]
  settings: AdminStoreSettings
  displayDate: string
  adminEmail: string
}) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [signingOut, startSignOut] = useTransition()
  const adminName = adminEmail.split('@')[0].replace(/[._-]+/g, ' ')
  const adminInitials = adminName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  const totalRevenue = orders.reduce((a, o) => a + o.total, 0)

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-border">
          <Link
            href="/"
            className="font-serif text-xl font-bold tracking-widest uppercase text-foreground"
          >
            LUXE
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {NAV_ITEMS.map(({ icon: Icon, label, tab }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left w-full ${
                activeTab === tab
                  ? 'bg-secondary text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          ))}
          <Separator className="bg-border my-2" />
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left w-full ${
              activeTab === 'settings'
                ? 'bg-secondary text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="bg-brand/20 text-brand text-xs font-semibold">
                {adminInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate capitalize">{adminName}</p>
              <p className="text-xs text-muted-foreground truncate">{adminEmail}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              disabled={signingOut}
              onClick={() => startSignOut(() => void signOutCustomer())}
              className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-bold text-foreground capitalize">{activeTab}</h1>
            <p className="text-xs text-muted-foreground">{displayDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="bg-foreground text-background hover:bg-foreground/80 gap-2 text-xs"
              onClick={() => setActiveTab('products')}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Product
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* Stats */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Total Revenue',
                    value: `$${totalRevenue.toLocaleString()}`,
                    icon: DollarSign,
                    change: '+12.5%',
                    up: true,
                  },
                  {
                    label: 'Total Orders',
                    value: orders.length.toString(),
                    icon: ShoppingCart,
                    change: '+8.2%',
                    up: true,
                  },
                  {
                    label: 'Products',
                    value: products.length.toString(),
                    icon: Package,
                    change: '+2 this week',
                    up: true,
                  },
                  {
                    label: 'Customers',
                    value: customers.length.toString(),
                    icon: Users,
                    change: '-1.4%',
                    up: false,
                  },
                ].map(({ label, value, icon: Icon, change, up }) => (
                  <div key={label} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {label}
                      </p>
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    <p
                      className={`text-xs mt-1 flex items-center gap-1 ${up ? 'text-brand' : 'text-destructive'}`}
                    >
                      {up ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {change}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent Orders */}
              <div className="rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">Recent Orders</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground gap-1"
                    onClick={() => setActiveTab('orders')}
                  >
                    View all <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between px-5 py-4 gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 2).map((item) => (
                            <div
                              key={item.product.id}
                              className="relative w-9 h-9 rounded-md overflow-hidden bg-secondary border border-border flex-shrink-0"
                            >
                              <Image
                                src={item.product.image}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                                sizes="36px"
                              />
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{order.id}</p>
                          <p className="text-xs text-muted-foreground">{order.date}</p>
                        </div>
                      </div>
                      <Badge className={`capitalize text-xs ${STATUS_STYLES[order.status]}`}>
                        {order.status}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">${order.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products */}
              <div className="rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">Top Products</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground gap-1"
                    onClick={() => setActiveTab('products')}
                  >
                    View all <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {products.slice(0, 5).map((product, i) => (
                    <div key={product.id} className="flex items-center gap-4 px-5 py-3">
                      <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                        <Image
                          src={product.images[0] ?? '/images/product-1.png'}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">${product.price}</p>
                        <p className="text-xs text-muted-foreground">{product.reviews} reviews</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && <AdminProducts products={products} />}

          {activeTab === 'settings' && <AdminSettings settings={settings} />}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
                  <span className="col-span-3">Order ID</span>
                  <span className="col-span-2">Date</span>
                  <span className="col-span-3">Items</span>
                  <span className="col-span-2">Status</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>
                <div className="divide-y divide-border">
                  {orders.map((order) => (
                    <div key={order.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center">
                      <div className="col-span-3">
                        <p className="text-sm font-medium text-foreground">{order.id}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">{order.date}</p>
                      </div>
                      <div className="col-span-3">
                        <p className="text-xs text-muted-foreground truncate">
                          {order.items.map((i) => i.product.name).join(', ')}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <Badge className={`capitalize text-xs ${STATUS_STYLES[order.status]}`}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm font-semibold text-foreground">
                          ${order.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coupons' && <AdminCoupons coupons={coupons} />}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
                  <span className="col-span-4">Customer</span>
                  <span className="col-span-2 text-center">Orders</span>
                  <span className="col-span-2 text-right">Spent</span>
                  <span className="col-span-2 text-center">Status</span>
                  <span className="col-span-2 text-right">Actions</span>
                </div>
                <div className="divide-y divide-border">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="grid grid-cols-12 gap-4 px-5 py-4 items-center"
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border flex-shrink-0">
                          <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
                            {customer.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {customer.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-sm text-foreground">{customer.orders}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm font-semibold text-foreground">
                          ${customer.spent}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <Badge
                          className={`capitalize text-xs border-0 ${
                            customer.status === 'vip'
                              ? 'bg-brand/20 text-brand'
                              : customer.status === 'active'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {customer.status}
                        </Badge>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
