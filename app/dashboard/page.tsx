import { asc, desc, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { db, safeQuery } from '@/lib/db'
import {
  customerAddresses,
  customerPaymentMethods,
  customerPreferences,
  customerProfiles,
  customerWishlist,
  orders,
  returnRequests,
} from '@/lib/db/schema'
import { getCustomerEmail } from '@/lib/customer-session'
import { DashboardClient } from '@/components/customer-dashboard'
import type { OrderRecord } from '@/lib/dashboard-types'

export const metadata = {
  title: 'My LUXE Account',
  description: 'Manage your LUXE orders, profile, addresses, and preferences.',
}

export default async function DashboardPage() {
  const email = await getCustomerEmail()
  if (!email) redirect('/login')

  // Signed-in customers still get their account shell (with sensible empty
  // states) if the database is not configured or a query fails.
  const [profileRows, orderRows, addresses, wishlist, preferenceRows, payments, returns] =
    await safeQuery(
      'dashboard:account',
      () =>
        Promise.all([
          db.select().from(customerProfiles).where(eq(customerProfiles.email, email)).limit(1),
          db.select().from(orders).where(eq(orders.email, email)).orderBy(desc(orders.createdAt)),
          db
            .select()
            .from(customerAddresses)
            .where(eq(customerAddresses.email, email))
            .orderBy(desc(customerAddresses.createdAt)),
          db
            .select()
            .from(customerWishlist)
            .where(eq(customerWishlist.email, email))
            .orderBy(desc(customerWishlist.createdAt)),
          db
            .select()
            .from(customerPreferences)
            .where(eq(customerPreferences.email, email))
            .limit(1),
          db
            .select()
            .from(customerPaymentMethods)
            .where(eq(customerPaymentMethods.email, email))
            .orderBy(asc(customerPaymentMethods.createdAt)),
          db
            .select()
            .from(returnRequests)
            .where(eq(returnRequests.email, email))
            .orderBy(desc(returnRequests.createdAt)),
        ]),
      [[], [], [], [], [], [], []] as [
        (typeof customerProfiles.$inferSelect)[],
        (typeof orders.$inferSelect)[],
        (typeof customerAddresses.$inferSelect)[],
        (typeof customerWishlist.$inferSelect)[],
        (typeof customerPreferences.$inferSelect)[],
        (typeof customerPaymentMethods.$inferSelect)[],
        (typeof returnRequests.$inferSelect)[],
      ],
    )

  const profile = profileRows[0] ?? {
    email,
    firstName: '',
    lastName: '',
    phone: '',
    birthday: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    id: '',
  }
  const preferences = preferenceRows[0] ?? {
    email,
    orderUpdates: true,
    promotions: false,
    newArrivals: true,
    smsUpdates: false,
    updatedAt: new Date(),
  }

  const customerOrders = orderRows.map((order) => ({
    ...order,
    address: order.address as OrderRecord['address'],
    items: order.items as OrderRecord['items'],
  }))

  return (
    <DashboardClient
      profile={profile}
      orders={customerOrders}
      addresses={addresses}
      wishlist={wishlist}
      preferences={preferences}
      payments={payments}
      returns={returns}
    />
  )
}
