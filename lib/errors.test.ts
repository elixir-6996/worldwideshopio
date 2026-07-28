import { describe, expect, it } from 'vitest'
import { AppError, errors, isAppError, toAppError } from '@/lib/errors'

describe('AppError', () => {
  it('applies the default HTTP status for its code', () => {
    const error = new AppError('NOT_FOUND', 'Missing product')
    expect(error.status).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
    expect(error.expose).toBe(true)
  })

  it('does not expose internal errors by default', () => {
    const error = new AppError('INTERNAL', 'db connection dropped')
    expect(error.expose).toBe(false)
    expect(error.toJSON().message).toBe('Something went wrong.')
  })

  it('serializes exposed errors with their real message and context', () => {
    const error = new AppError('VALIDATION', 'Email is required', {
      context: { field: 'email' },
    })
    expect(error.toJSON()).toEqual({
      name: 'AppError',
      code: 'VALIDATION',
      status: 422,
      message: 'Email is required',
      context: { field: 'email' },
    })
  })
})

describe('isAppError', () => {
  it('identifies AppError instances', () => {
    expect(isAppError(errors.notFound())).toBe(true)
    expect(isAppError(new Error('plain'))).toBe(false)
    expect(isAppError('nope')).toBe(false)
  })
})

describe('toAppError', () => {
  it('returns AppError instances unchanged', () => {
    const original = errors.forbidden()
    expect(toAppError(original)).toBe(original)
  })

  it('wraps native errors as non-exposed internal errors', () => {
    const wrapped = toAppError(new Error('boom'))
    expect(wrapped.code).toBe('INTERNAL')
    expect(wrapped.expose).toBe(false)
    expect(wrapped.cause).toBeInstanceOf(Error)
  })

  it('wraps unknown thrown values', () => {
    const wrapped = toAppError('string failure')
    expect(wrapped.code).toBe('INTERNAL')
    expect(wrapped.message).toBe('An unexpected error occurred.')
  })
})
