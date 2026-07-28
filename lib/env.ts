import { z } from 'zod'

/**
 * Centralized, runtime-validated environment configuration.
 *
 * This is the single source of truth for reading environment variables.
 * Application code MUST import `env` from here instead of touching
 * `process.env` directly, so that:
 *   - every variable is validated and correctly typed,
 *   - missing/invalid values fail loudly and early with a clear message,
 *   - the set of expected variables is documented in one place.
 *
 * NOTE (milestone scope): the concrete integrations (database, auth, payments,
 * media) are not wired up yet. To keep the current build non-breaking, the
 * server-side variables are declared `optional()` so the app boots without a
 * populated `.env.local`. When a feature that needs a variable is implemented,
 * tighten its schema (e.g. drop `.optional()` or add `.min(1)`) so it becomes
 * a hard requirement.
 */

/**
 * Server-only variables. These are never exposed to the browser and must only
 * be read in server components, route handlers, server actions, or scripts.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().url().optional(),

  AUTH_SECRET: z.string().min(1).optional(),

  CUSTOMER_SESSION_SECRET: z.string().min(32).optional(),
  ADMIN_EMAIL_ALLOWLIST: z.string().min(3).optional(),

  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),

  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
})

/**
 * Client-safe variables. Must be prefixed with `NEXT_PUBLIC_` so Next.js
 * inlines them into the client bundle. Never place secrets here.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
})

/**
 * Next.js only statically replaces `process.env.NEXT_PUBLIC_*` when referenced
 * by its full literal path, so client vars are listed out explicitly rather
 * than passing `process.env` wholesale.
 */
const clientRuntime = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
}

type ServerEnv = z.infer<typeof serverSchema>
type ClientEnv = z.infer<typeof clientSchema>
export type Env = ServerEnv & ClientEnv

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
}

function parseEnv(): Env {
  const isServer = typeof window === 'undefined'

  const clientResult = clientSchema.safeParse(clientRuntime)
  if (!clientResult.success) {
    throw new Error(`Invalid public environment variables:\n${formatIssues(clientResult.error)}`)
  }

  // On the client, server variables are neither available nor allowed. Return
  // only the validated public config to avoid leaking or misreporting secrets.
  if (!isServer) {
    return clientResult.data as Env
  }

  const serverResult = serverSchema.safeParse(process.env)
  if (!serverResult.success) {
    throw new Error(`Invalid server environment variables:\n${formatIssues(serverResult.error)}`)
  }

  return { ...serverResult.data, ...clientResult.data }
}

export const env: Env = parseEnv()
