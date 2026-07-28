'use server'

import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { DEFAULT_ADMIN_EMAIL } from '@/lib/admin-auth'
import { db, isDatabaseConfigured } from '@/lib/db'
import {
  customerAddresses,
  customerPreferences,
  customerProfiles,
  returnRequests,
} from '@/lib/db/schema'
import { clearCustomerSession, getCustomerEmail, setCustomerSession } from '@/lib/customer-session'

const emailSchema = z.string().email().max(254)

async function customerEmail() {
  const email = await getCustomerEmail()
  if (!email) throw new Error('Please sign in to continue.')
  return email
}

/**
 * Creates the profile rows for an email when a database is available.
 * Never throws: sign-in must succeed even before the database is provisioned.
 */
async function ensureCustomerRecords(email: string, name?: string) {
  if (!isDatabaseConfigured) return
  const fullName = (name ?? '').trim().split(/\s+/).filter(Boolean)
  try {
    await db
      .insert(customerProfiles)
      .values({
        email,
        firstName: fullName[0] ?? '',
        lastName: fullName.slice(1).join(' '),
      })
      .onConflictDoNothing()
    await db.insert(customerPreferences).values({ email }).onConflictDoNothing()
  } catch (error) {
    console.error('[v0] Could not persist customer profile for sign-in:', error)
  }
}

export async function signInCustomer(emailInput: string, name?: string) {
  const email = emailSchema.parse(emailInput.trim().toLowerCase())
  await ensureCustomerRecords(email, name)
  await setCustomerSession(email)
  // redirect() throws internally, so it stays outside any try/catch above.
  redirect('/dashboard')
}

/** Signs in as the built-in administrator and opens the admin area. */
export async function signInAdmin() {
  await ensureCustomerRecords(DEFAULT_ADMIN_EMAIL, 'LUXE Admin')
  await setCustomerSession(DEFAULT_ADMIN_EMAIL)
  redirect('/admin')
}

export async function signOutCustomer() {
  await clearCustomerSession()
  redirect('/login')
}

export async function updateProfile(formData: FormData) {
  const email = await customerEmail()
  const values = z
    .object({
      firstName: z.string().trim().min(1).max(60),
      lastName: z.string().trim().min(1).max(60),
      phone: z.string().trim().max(30),
      birthday: z.string().trim().max(20),
    })
    .parse(Object.fromEntries(formData))
  await db
    .update(customerProfiles)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(customerProfiles.email, email))
  revalidatePath('/dashboard')
}

export async function addAddress(formData: FormData) {
  const email = await customerEmail()
  const values = z
    .object({
      label: z.string().trim().min(1).max(30),
      firstName: z.string().trim().min(1).max(60),
      lastName: z.string().trim().min(1).max(60),
      street: z.string().trim().min(5).max(120),
      city: z.string().trim().min(2).max(60),
      region: z.string().trim().min(2).max(60),
      postalCode: z.string().trim().min(3).max(12),
      country: z.string().trim().min(2).max(60),
    })
    .parse(Object.fromEntries(formData))
  await db.insert(customerAddresses).values({ ...values, email })
  revalidatePath('/dashboard')
}

export async function deleteAddress(id: string) {
  const email = await customerEmail()
  await db
    .delete(customerAddresses)
    .where(
      and(
        eq(customerAddresses.id, z.string().uuid().parse(id)),
        eq(customerAddresses.email, email),
      ),
    )
  revalidatePath('/dashboard')
}

export async function updatePreferences(values: {
  orderUpdates: boolean
  promotions: boolean
  newArrivals: boolean
  smsUpdates: boolean
}) {
  const email = await customerEmail()
  const clean = z
    .object({
      orderUpdates: z.boolean(),
      promotions: z.boolean(),
      newArrivals: z.boolean(),
      smsUpdates: z.boolean(),
    })
    .parse(values)
  await db
    .insert(customerPreferences)
    .values({ email, ...clean })
    .onConflictDoUpdate({
      target: customerPreferences.email,
      set: { ...clean, updatedAt: new Date() },
    })
  revalidatePath('/dashboard')
}

export async function requestReturn(orderId: string) {
  const email = await customerEmail()
  const id = z.string().uuid().parse(orderId)
  const [order] = await db.query.orders.findMany({
    where: (table, { and, eq }) => and(eq(table.id, id), eq(table.email, email)),
    limit: 1,
  })
  if (!order) throw new Error('Order not found.')
  await db.insert(returnRequests).values({ email, orderId: id, reason: 'Changed my mind' })
  revalidatePath('/dashboard')
}
