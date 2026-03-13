import crypto from 'node:crypto'

const LOGIN_WINDOW_MS = 10 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 8
const LOGIN_COOLDOWN_MS = 15 * 60 * 1000
const loginAttempts = new Map<string, { count: number; firstAttempt: number; blockedUntil?: number }>()

function getClientIp(event: any) {
  return (getRequestIP(event, { xForwardedFor: true }) || 'unknown').toLowerCase().slice(0, 128)
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
  const ip = getClientIp(event)
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (entry?.blockedUntil && now < entry.blockedUntil) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Trop de tentatives. Réessayez plus tard.',
    })
  }

  const adminPassword = String(config.adminPassword || '')
  if (!adminPassword) {
    throw createError({ statusCode: 500, statusMessage: 'Admin auth is not configured' })
  }

  const candidate = typeof body?.password === 'string' ? body.password : ''
  const isValid = safeEqual(candidate, adminPassword)

  if (!isValid) {
    const base = !entry || now - entry.firstAttempt > LOGIN_WINDOW_MS
      ? { count: 1, firstAttempt: now }
      : { ...entry, count: entry.count + 1 }

    if (base.count >= MAX_LOGIN_ATTEMPTS) {
      base.blockedUntil = now + LOGIN_COOLDOWN_MS
    }

    loginAttempts.set(ip, base)
    throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
  }

  loginAttempts.delete(ip)

  await setUserSession(event, {
    user: { name: 'admin' },
  })

  return { ok: true }
})
