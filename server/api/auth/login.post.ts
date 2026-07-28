import crypto from 'node:crypto'

const LOGIN_LIMIT = {
  max: 8,
  windowMs: 10 * 60 * 1000,
  blockMs: 15 * 60 * 1000,
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  if (left.length !== right.length) {
    return false
  }

  return crypto.timingSafeEqual(left, right)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  const ip = (getRequestIP(event, { xForwardedFor: true }) || 'unknown').toLowerCase().slice(0, 128)
  const rateKey = `admin-login:${ip}`
  const now = Date.now()

  // Must short-circuit before the comparison below, or the block would throttle
  // only the response and leave brute-forcing unimpeded.
  if (!isRateLimited(rateKey).ok) {
    throw createError({ statusCode: 429, statusMessage: 'Trop de tentatives. Réessayez plus tard.' })
  }

  const adminPassword = String(config.adminPassword || '')
  if (!adminPassword) {
    throw createError({ statusCode: 500, statusMessage: 'Admin auth is not configured' })
  }

  if (adminPassword.length < 12) {
    // Keep the reason server-side only — the client must not learn the env var name
    // or that the configured password is short.
    console.error('[auth] NUXT_ADMIN_PASSWORD is shorter than 12 characters — admin login disabled until it is rotated.')
    throw createError({ statusCode: 500, statusMessage: 'Admin auth is not configured' })
  }

  const candidate = typeof body?.password === 'string' ? body.password : ''
  const isValid = safeEqual(candidate, adminPassword)

  if (!isValid) {
    // Only failures count, so a valid admin is never locked out.
    const result = consumeRateLimit(rateKey, LOGIN_LIMIT)

    console.log(JSON.stringify({
      event: 'auth.login',
      result: 'failure',
      ip,
      timestamp: new Date(now).toISOString(),
      blocked: !result.ok,
    }))

    if (!result.ok) {
      throw createError({ statusCode: 429, statusMessage: 'Trop de tentatives. Réessayez plus tard.' })
    }

    throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
  }

  resetRateLimit(rateKey)

  console.log(JSON.stringify({
    event: 'auth.login',
    result: 'success',
    ip,
    timestamp: new Date(now).toISOString(),
  }))

  await setUserSession(event, {
    user: { role: 'admin', name: 'admin' },
  }, { maxAge: 8 * 60 * 60 })

  return { ok: true }
})
