import 'server-only'

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

import { env } from '@/lib/env'

const COOKIE_NAME = 'luxe_customer'

/**
 * Fallback signing key used only when CUSTOMER_SESSION_SECRET is absent.
 *
 * Sessions signed with it are still tamper-proof for the lifetime of the
 * process, but they are NOT portable across deploys/instances. Set
 * CUSTOMER_SESSION_SECRET in the environment for real durable sessions.
 */
const ephemeralSecret = randomBytes(32).toString('base64url')
let warnedAboutFallback = false

function secret() {
  const value = env.CUSTOMER_SESSION_SECRET
  if (value) return value

  if (!warnedAboutFallback) {
    warnedAboutFallback = true
    console.warn(
      '[v0] CUSTOMER_SESSION_SECRET is not set - using an in-memory signing key. Sign-in works, but sessions reset when the server restarts.',
    )
  }
  return ephemeralSecret
}

function isFrameworkError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'digest' in error
}

function sign(email: string) {
  return createHmac('sha256', secret()).update(email).digest('base64url')
}

export async function setCustomerSession(emailInput: string) {
  const email = emailInput.trim().toLowerCase()
  const store = await cookies()
  store.set(COOKIE_NAME, `${email}.${sign(email)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

export async function getCustomerEmail() {
  try {
    const value = (await cookies()).get(COOKIE_NAME)?.value
    if (!value) return null
    const separator = value.lastIndexOf('.')
    if (separator < 1) return null
    const email = value.slice(0, separator)
    const signature = value.slice(separator + 1)
    const expected = sign(email)
    if (signature.length !== expected.length) return null
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? email : null
  } catch (error) {
    // Next.js signals control flow (dynamic usage, redirects, notFound) with
    // errors carrying a `digest`. Those must propagate untouched.
    if (isFrameworkError(error)) throw error
    // A malformed or stale cookie must never take down the page that reads it.
    console.warn('[v0] Could not read customer session:', error)
    return null
  }
}

export async function clearCustomerSession() {
  ;(await cookies()).delete(COOKIE_NAME)
}
