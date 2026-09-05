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

export const ADMIN_SESSION_EXPIRED = 'Your admin session is no longer valid. Please sign in again.'

/**
 * Non-throwing guard for server actions.
 *
 * Actions return a result object to the client, so an expired or missing
 * session should surface as an inline message instead of an unhandled error.
 */
export async function adminGuard(): Promise<
  { ok: true; email: string } | { ok: false; error: string }
> {
  const email = await getCustomerEmail()
  if (!email || !adminEmails().has(email.toLowerCase())) {
    return { ok: false, error: ADMIN_SESSION_EXPIRED }
  }
  return { ok: true, email }
}
