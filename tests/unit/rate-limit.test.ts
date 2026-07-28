import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { consumeRateLimit, isRateLimited, resetRateLimit } from '../../server/utils/rate-limit'

const LIMIT = { max: 3, windowMs: 60_000, blockMs: 300_000 }

// Each test uses its own key so the module-level bucket map cannot leak between them.
let counter = 0
function freshKey() {
  counter += 1
  return `test-key-${counter}`
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('consumeRateLimit', () => {
  it('allows hits below the limit', () => {
    const key = freshKey()
    expect(consumeRateLimit(key, LIMIT).ok).toBe(true)
    expect(consumeRateLimit(key, LIMIT).ok).toBe(true)
  })

  it('blocks once max is reached', () => {
    const key = freshKey()
    consumeRateLimit(key, LIMIT)
    consumeRateLimit(key, LIMIT)
    const third = consumeRateLimit(key, LIMIT)

    expect(third.ok).toBe(false)
    expect(third.retryAfterMs).toBe(LIMIT.blockMs)
  })

  it('keeps blocking for the whole cooldown', () => {
    const key = freshKey()
    consumeRateLimit(key, LIMIT)
    consumeRateLimit(key, LIMIT)
    consumeRateLimit(key, LIMIT)

    vi.advanceTimersByTime(LIMIT.blockMs - 1_000)
    expect(consumeRateLimit(key, LIMIT).ok).toBe(false)
  })

  it('allows again once the cooldown expires', () => {
    const key = freshKey()
    consumeRateLimit(key, LIMIT)
    consumeRateLimit(key, LIMIT)
    consumeRateLimit(key, LIMIT)

    vi.advanceTimersByTime(LIMIT.blockMs + 1_000)
    expect(consumeRateLimit(key, LIMIT).ok).toBe(true)
  })

  it('starts a fresh window after it rolls over', () => {
    const key = freshKey()
    consumeRateLimit(key, LIMIT)
    consumeRateLimit(key, LIMIT)

    vi.advanceTimersByTime(LIMIT.windowMs + 1)

    // The two earlier hits fell out of the window, so this must not block.
    expect(consumeRateLimit(key, LIMIT).ok).toBe(true)
    expect(consumeRateLimit(key, LIMIT).ok).toBe(true)
  })

  it('tracks keys independently', () => {
    const a = freshKey()
    const b = freshKey()
    consumeRateLimit(a, LIMIT)
    consumeRateLimit(a, LIMIT)
    consumeRateLimit(a, LIMIT)

    expect(isRateLimited(a).ok).toBe(false)
    expect(isRateLimited(b).ok).toBe(true)
  })
})

describe('isRateLimited', () => {
  it('does not count as a hit', () => {
    const key = freshKey()
    consumeRateLimit(key, LIMIT)

    // Peeking repeatedly must never push the bucket over the limit.
    for (let i = 0; i < 10; i++) {
      expect(isRateLimited(key).ok).toBe(true)
    }

    expect(consumeRateLimit(key, LIMIT).ok).toBe(true)
  })

  it('reports a block set by consumeRateLimit', () => {
    const key = freshKey()
    consumeRateLimit(key, LIMIT)
    consumeRateLimit(key, LIMIT)
    consumeRateLimit(key, LIMIT)

    const status = isRateLimited(key)
    expect(status.ok).toBe(false)
    expect(status.retryAfterMs).toBeGreaterThan(0)
  })

  it('is unblocked for an unknown key', () => {
    expect(isRateLimited(freshKey()).ok).toBe(true)
  })
})

describe('resetRateLimit', () => {
  it('clears a block, as a successful login does', () => {
    const key = freshKey()
    consumeRateLimit(key, LIMIT)
    consumeRateLimit(key, LIMIT)
    consumeRateLimit(key, LIMIT)
    expect(isRateLimited(key).ok).toBe(false)

    resetRateLimit(key)
    expect(isRateLimited(key).ok).toBe(true)
  })
})
