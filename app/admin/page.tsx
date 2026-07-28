import { desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin-dashboard'
import { isAdmin } from '@/lib/admin-auth'
import { getCustomerEmail } from '@/lib/customer-session'
import { db, safeQuery } from '@/lib/db'
import { coupons as couponsTable, orders as ordersTable } from '@/lib/db/schema'
import { getAllProductRows, getStoreSettings, toProduct } from '@/lib/products'
import { type Order } from '@/lib/store'

export const dynamic = 'force-dynamic'

type StoredItem = {
  productId: string
  name: string
  image?: string
  price: number
  quantity: number
  size?: string
  color?: string
}

function toOrderStatus(status: string): Order['status'] {
  return status === 'shipped' || status === 'delivered' || status === 'cancelled'
    ? status
    : 'processing'
}

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/login')
  const adminEmail = (await getCustomerEmail()) ?? ''
  const displayDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date())
  // The dashboard renders with empty collections when the database is missing
  // or unreachable, instead of surfacing an error page to the administrator.
  const [rows, couponRows, productRows, settings] = await Promise.all([
    safeQuery(
      'admin:orders',
      () => db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)),
      [] as (typeof ordersTable.$inferSelect)[],
    ),
    safeQuery(
      'admin:coupons',
      () => db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt)),
      [] as (typeof couponsTable.$inferSelect)[],
    ),
    getAllProductRows(),
    getStoreSettings(),
  ])
  const catalog = productRows.map(toProduct)
  const adminOrders: Order[] = rows.map((row) => ({
    id: row.orderNumber,
    date: row.createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    status: toOrderStatus(row.status),
    total: row.total,
    items: (row.items as StoredItem[]).map((item) => ({
      product: catalog.find((product) => product.id === item.productId) ?? {
        id: item.productId,
        name: item.name,
        price: item.price,
        image: item.image ?? '/images/product-1.png',
        category: 'Product',
        description: '',
        rating: 0,
        reviews: 0,
        inStock: false,
      },
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    })),
  }))

  const customerMap = new Map<
    string,
    { id: string; name: string; email: string; orders: number; spent: number; status: string }
  >()
  for (const row of rows) {
    const current = customerMap.get(row.email)
    const address = row.address as { firstName?: string; lastName?: string }
    const name = [address.firstName, address.lastName].filter(Boolean).join(' ') || row.email
    customerMap.set(row.email, {
      id: row.email,
      name: current?.name ?? name,
      email: row.email,
      orders: (current?.orders ?? 0) + 1,
      spent: (current?.spent ?? 0) + (row.paymentStatus === 'paid' ? row.total : 0),
      status: (current?.spent ?? 0) + row.total >= 1000 ? 'vip' : 'active',
    })
  }

  return (
    <AdminDashboard
      orders={adminOrders}
      customers={[...customerMap.values()]}
      coupons={couponRows.map((coupon) => ({
        ...coupon,
        startsAt: coupon.startsAt?.toISOString() ?? null,
        endsAt: coupon.endsAt?.toISOString() ?? null,
      }))}
      products={productRows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        category: row.category,
        price: row.price,
        originalPrice: row.originalPrice,
        images: row.images,
        sizes: row.sizes,
        colors: row.colors,
        rating: row.rating,
        reviews: row.reviews,
        inStock: row.inStock,
        badge: row.badge,
        status: row.status,
        sortOrder: row.sortOrder,
      }))}
      settings={{
        storeName: settings.storeName,
        tagline: settings.tagline,
        supportEmail: settings.supportEmail,
        currency: settings.currency,
        freeShippingThreshold: settings.freeShippingThreshold,
        standardShippingRate: settings.standardShippingRate,
        expressShippingRate: settings.expressShippingRate,
      }}
      adminEmail={adminEmail}
      displayDate={displayDate}
    />
  )
}
