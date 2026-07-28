/**
 * Shared application error model.
 *
 * Provides a single, consistent error structure for the whole app so that
 * server actions, route handlers, and services can throw typed errors and
 * have them serialized/handled uniformly. This is foundation code — existing
 * modules are not required to adopt it yet.
 */

/**
 * Stable, machine-readable error codes. Extend this union as new failure
 * categories appear. Keep codes coarse-grained and transport-agnostic.
 */
export type AppErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'RATE_LIMITED'
  | 'INTERNAL'

/** Default HTTP status per error code, used when none is supplied. */
const DEFAULT_STATUS: Record<AppErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
}

/** Arbitrary structured context attached to an error for logging/debugging. */
export type ErrorContext = Record<string, unknown>

export interface AppErrorOptions {
  /** HTTP status override. Defaults to a sensible value per code. */
  status?: number
  /** Underlying cause (preserved via the native Error `cause`). */
  cause?: unknown
  /** Structured, non-sensitive context for logs. */
  context?: ErrorContext
  /**
   * Whether this error is safe to expose to end users. Operational errors
   * (validation, not found, etc.) are; unexpected internal errors are not.
   */
  expose?: boolean
}

/** Plain, serializable shape of an `AppError` (safe to send over the wire). */
export interface SerializedAppError {
  name: 'AppError'
  code: AppErrorCode
  message: string
  status: number
  context?: ErrorContext
}

/**
 * The canonical application error. Prefer throwing this (or a factory below)
 * over bare `Error` so failures carry a stable code, HTTP status, and context.
 */
export class AppError extends Error {
  readonly name = 'AppError'
  readonly code: AppErrorCode
  readonly status: number
  readonly context?: ErrorContext
  readonly expose: boolean

  constructor(code: AppErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined)
    this.code = code
    this.status = options.status ?? DEFAULT_STATUS[code]
    this.context = options.context
    this.expose = options.expose ?? code !== 'INTERNAL'

    // Maintain a proper prototype chain when targeting older runtimes.
    Object.setPrototypeOf(this, AppError.prototype)
  }

  /** Convert to a plain object safe for client responses (hides internals). */
  toJSON(): SerializedAppError {
    return {
      name: this.name,
      code: this.code,
      status: this.status,
      message: this.expose ? this.message : 'Something went wrong.',
      ...(this.context ? { context: this.context } : {}),
    }
  }
}

/** Type guard for `AppError`. */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Normalize any thrown value into an `AppError`. Unknown/unexpected values
 * become a non-exposed `INTERNAL` error so raw messages never leak to users.
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error

  if (error instanceof Error) {
    return new AppError('INTERNAL', error.message, { cause: error, expose: false })
  }

  return new AppError('INTERNAL', 'An unexpected error occurred.', {
    cause: error,
    expose: false,
  })
}

/** Convenience factories for the most common error categories. */
export const errors = {
  badRequest: (message = 'Bad request.', options?: AppErrorOptions) =>
    new AppError('BAD_REQUEST', message, options),
  unauthorized: (message = 'Authentication required.', options?: AppErrorOptions) =>
    new AppError('UNAUTHORIZED', message, options),
  forbidden: (message = 'You do not have access to this resource.', options?: AppErrorOptions) =>
    new AppError('FORBIDDEN', message, options),
  notFound: (message = 'Resource not found.', options?: AppErrorOptions) =>
    new AppError('NOT_FOUND', message, options),
  conflict: (message = 'Resource conflict.', options?: AppErrorOptions) =>
    new AppError('CONFLICT', message, options),
  validation: (message = 'Validation failed.', options?: AppErrorOptions) =>
    new AppError('VALIDATION', message, options),
  rateLimited: (message = 'Too many requests.', options?: AppErrorOptions) =>
    new AppError('RATE_LIMITED', message, options),
  internal: (message = 'Internal server error.', options?: AppErrorOptions) =>
    new AppError('INTERNAL', message, { expose: false, ...options }),
}
