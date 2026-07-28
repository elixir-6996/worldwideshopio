import 'server-only'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  checkoutPool?: Pool
  checkoutDatabaseUrl?: string
}

const connectionString = process.env.DATABASE_URL
const canReusePool =
  globalForDb.checkoutPool && globalForDb.checkoutDatabaseUrl === connectionString

export const pool = canReusePool ? globalForDb.checkoutPool! : new Pool({ connectionString })

if (process.env.NODE_ENV !== 'production') {
  if (globalForDb.checkoutPool && !canReusePool) void globalForDb.checkoutPool.end()
  globalForDb.checkoutPool = pool
  globalForDb.checkoutDatabaseUrl = connectionString
}

export const db = drizzle(pool, { schema })

/** True only when a Postgres connection string is actually available. */
export const isDatabaseConfigured = Boolean(connectionString)

/**
 * Runs a query and returns `fallback` instead of throwing when the database is
 * unconfigured or unreachable. Use this on read paths that should still render
 * a usable page (dashboards, listings) rather than an error screen.
 */
export async function safeQuery<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  if (!isDatabaseConfigured) {
    console.warn(`[v0] Skipping "${label}" - DATABASE_URL is not set.`)
    return fallback
  }
  try {
    return await run()
  } catch (error) {
    console.error(`[v0] Query "${label}" failed:`, error)
    return fallback
  }
}
