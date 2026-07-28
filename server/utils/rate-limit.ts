/**
 * In-memory rate limiter.
 *
 * Deliberately process-local: the app runs as a single container (see
 * docs/design-comptes-gestionnaires.md). Counters reset on restart, which is
 * acceptable for abuse throttling — it is not a security boundary on its own.
 */

interface Bucket {
  count: number
  firstHit: number
  blockedUntil?: number
}

export interface RateLimitOptions {
  /** Hits allowed inside the window before blocking. */
  max: number
  /** Rolling window length in ms. */
  windowMs: number
  /** How long to block once `max` is reached. Defaults to `windowMs`. */
  blockMs?: number
}

export interface RateLimitResult {
  ok: boolean
  retryAfterMs: number
}

const buckets = new Map<string, Bucket>()
const SWEEP_THRESHOLD = 5_000

/** Drops entries that can no longer block anyone, keeping the map bounded. */
function sweep(now: number, maxAgeMs: number) {
  for (const [key, bucket] of buckets) {
    const expired = now - bucket.firstHit > maxAgeMs
    const unblocked = !bucket.blockedUntil || now >= bucket.blockedUntil
    if (expired && unblocked) buckets.delete(key)
  }
}

/**
 * Records one hit against `key` and reports whether it is allowed.
 *
 * Count only the events you want to throttle: for logins, call this on failure
 * only and `resetRateLimit` on success, so valid users are never locked out.
 */
export function consumeRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { max, windowMs } = options
  const blockMs = options.blockMs ?? windowMs
  const now = Date.now()

  if (buckets.size > SWEEP_THRESHOLD) sweep(now, windowMs + blockMs)

  const existing = buckets.get(key)

  if (existing?.blockedUntil && now < existing.blockedUntil) {
    return { ok: false, retryAfterMs: existing.blockedUntil - now }
  }

  const bucket: Bucket = !existing || now - existing.firstHit > windowMs
    ? { count: 1, firstHit: now }
    : { ...existing, blockedUntil: undefined, count: existing.count + 1 }

  if (bucket.count >= max) {
    bucket.blockedUntil = now + blockMs
  }

  buckets.set(key, bucket)

  return bucket.blockedUntil
    ? { ok: false, retryAfterMs: blockMs }
    : { ok: true, retryAfterMs: 0 }
}

/**
 * Reports whether `key` is currently blocked, without recording a hit.
 *
 * Check this *before* doing the work you are protecting: on a login route the
 * block must short-circuit the password comparison itself, otherwise an
 * attacker keeps guessing and simply reads the status code.
 */
export function isRateLimited(key: string): RateLimitResult {
  const bucket = buckets.get(key)
  const now = Date.now()

  if (bucket?.blockedUntil && now < bucket.blockedUntil) {
    return { ok: false, retryAfterMs: bucket.blockedUntil - now }
  }

  return { ok: true, retryAfterMs: 0 }
}

/** Clears the counter for `key` (e.g. after a successful login). */
export function resetRateLimit(key: string): void {
  buckets.delete(key)
}

/** Consumes a hit and throws 429 when the limit is exceeded. */
export function enforceRateLimit(key: string, options: RateLimitOptions, message = 'Trop de tentatives. Réessayez plus tard.'): void {
  const result = consumeRateLimit(key, options)
  if (!result.ok) {
    throw createError({
      statusCode: 429,
      statusMessage: message,
      data: { retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000) },
    })
  }
}

/** Normalized client IP, safe to use as a rate-limit key. */
export function rateLimitKeyFromIp(event: Parameters<typeof getRequestIP>[0], prefix: string): string {
  const ip = (getRequestIP(event, { xForwardedFor: true }) || 'unknown').toLowerCase().slice(0, 128)
  return `${prefix}:${ip}`
}
