import 'server-only'

import { getCustomerEmail } from '@/lib/customer-session'
import { env } from '@/lib/env'

/**
 * Built-in administrator identity.
 *
 * This account is always permitted so the admin area is reachable out of the
 * box. Add further addresses with the comma-separated ADMIN_EMAIL_ALLOWLIST
 * environment variable.
 */
export const DEFAULT_ADMIN_EMAIL = 'admin@luxe.demo'

function adminEmails() {
  const emails = new Set<string>([DEFAULT_ADMIN_EMAIL])
  for (const entry of (env.ADMIN_EMAIL_ALLOWLIST ?? '').split(',')) {
    const email = entry.trim().toLowerCase()
    if (email) emails.add(email)
  }
  return emails
}

export async function isAdmin() {
  const email = await getCustomerEmail()
  return Boolean(email && adminEmails().has(email.toLowerCase()))
}

export async function requireAdmin() {
  const email = await getCustomerEmail()
  if (!email || !adminEmails().has(email.toLowerCase())) throw new Error('Unauthorized')
  return email
}
