import 'server-only'

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

import { env } from '@/lib/env'

const COOKIE_NAME = 'luxe_customer'

/**
 * Fallback signing key used only when CUSTOMER_SESSION_SECRET is absent.
 *
 * It is derived from values that stay constant for a given deployment (the
 * database URL / auth secret), so cookies keep verifying across server
 * restarts and module reloads instead of silently logging everyone out. A
 * random key is used only when nothing stable exists at all. Set
 * CUSTOMER_SESSION_SECRET for a properly rotated, portable secret.
 */
const randomFallback = randomBytes(32).toString('base64url')
let warnedAboutFallback = false

function derivedFallbackSecret() {
  const material = [env.AUTH_SECRET, env.DATABASE_URL].filter(Boolean).join('|')
  if (!material) return randomFallback
  return createHmac('sha256', 'luxe-customer-session-fallback').update(material).digest('base64url')
}

function secret() {
  const value = env.CUSTOMER_SESSION_SECRET
  if (value) return value

  if (!warnedAboutFallback) {
    warnedAboutFallback = true
    console.warn(
      '[v0] CUSTOMER_SESSION_SECRET is not set - deriving a signing key from the deployment config. Set CUSTOMER_SESSION_SECRET for a dedicated, rotatable secret.',
    )
  }
  return derivedFallbackSecret()
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
    // A malformed or stale cookie must never take down the page that reads it.
    console.warn('[v0] Could not read customer session:', error)
    return null
  }
}

export async function clearCustomerSession() {
  ;(await cookies()).delete(COOKIE_NAME)
}
