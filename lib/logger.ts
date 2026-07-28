/**
 * Logging abstraction.
 *
 * Application code logs through this `Logger` interface rather than calling
 * `console.*` directly. Today it is backed by a small console implementation;
 * later it can be swapped for Pino (or any transport) without touching call
 * sites — only `createLogger` changes.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** Structured metadata attached to a log line. Keep values non-sensitive. */
export type LogContext = Record<string, unknown>

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  /** Return a new logger that merges `bindings` into every log line. */
  child(bindings: LogContext): Logger
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function resolveMinLevel(): LogLevel {
  const fromEnv = process.env.LOG_LEVEL as LogLevel | undefined
  if (fromEnv && fromEnv in LEVEL_WEIGHT) return fromEnv
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

/**
 * Console-backed logger. Emits a single structured object per line so it is
 * greppable locally and ingestible by log processors in production.
 */
function createConsoleLogger(base: LogContext = {}): Logger {
  const minWeight = LEVEL_WEIGHT[resolveMinLevel()]

  const write = (level: LogLevel, message: string, context?: LogContext): void => {
    if (LEVEL_WEIGHT[level] < minWeight) return

    const entry = {
      level,
      time: new Date().toISOString(),
      message,
      ...base,
      ...context,
    }

    // Route to the matching console method so stderr/stdout separation is kept.
    const sink =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : level === 'debug'
            ? console.debug
            : console.info

    sink(JSON.stringify(entry))
  }

  return {
    debug: (message, context) => write('debug', message, context),
    info: (message, context) => write('info', message, context),
    warn: (message, context) => write('warn', message, context),
    error: (message, context) => write('error', message, context),
    child: (bindings) => createConsoleLogger({ ...base, ...bindings }),
  }
}

/** Factory for the active logger implementation. Swap here to adopt Pino. */
export function createLogger(base?: LogContext): Logger {
  return createConsoleLogger(base)
}

/** Shared application logger instance. */
export const logger: Logger = createLogger()
