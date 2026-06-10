import crypto from 'node:crypto'
import { deleteCookie, getCookie, getRequestIP, setCookie, type H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
export { sha256, normalizeIp } from './ip-utils'
import { sha256, normalizeIp } from './ip-utils'

const VOTE_SESSION_COOKIE = 'commus_vote_session'
const VOTE_INTENT_PREFIX = 'commus_vote_intent_'
const VOTE_SESSION_MAX_AGE = 365 * 24 * 60 * 60
const VOTE_INTENT_MAX_AGE = 24 * 60 * 60

export const MIN_VOTE_VIEW_MS = 8_000
export const MAX_VOTES_PER_IP_PER_HOUR = 3
export const MAX_VOTES_PER_IP_PER_DAY = 10

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}

// Generate a random in-process secret for dev (rotates on restart, that's OK)
const DEV_VOTE_SECRET = 'commus-dcs-dev-' + Math.random().toString(36).slice(2)

function getVoteSecret() {
  const config = useRuntimeConfig()
  const secret = config.sessionSecret || process.env.NUXT_SESSION_SECRET

  if (secret) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NUXT_SESSION_SECRET must be set in production')
  }

  console.warn('[vote-protection] No NUXT_SESSION_SECRET — using ephemeral dev secret (votes reset on restart)')
  return DEV_VOTE_SECRET
}

function sign(value: string) {
  return crypto
    .createHmac('sha256', getVoteSecret())
    .update(value)
    .digest('hex')
}

function encodePayload(payload: Record<string, string | number>) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodePayload<T>(payload: string): T | null {
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T
  } catch {
    return null
  }
}


export function getOrCreateVoteSession(event: H3Event) {
  const existing = getCookie(event, VOTE_SESSION_COOKIE)
  if (existing && /^[a-f0-9]{32}$/i.test(existing)) {
    return existing
  }

  const sessionId = crypto.randomBytes(16).toString('hex')
  setCookie(event, VOTE_SESSION_COOKIE, sessionId, getCookieOptions(VOTE_SESSION_MAX_AGE))
  return sessionId
}

function getIntentCookieName(slug: string) {
  return `${VOTE_INTENT_PREFIX}${slug}`
}

export function ensureVoteIntent(event: H3Event, slug: string, sessionId: string) {
  const cookieName = getIntentCookieName(slug)
  const existing = getCookie(event, cookieName)

  if (existing) {
    const [encodedPayload, signature] = existing.split('.')
    if (encodedPayload && signature) {
      const decoded = decodePayload<{ slug: string; sessionId: string; issuedAt: number }>(encodedPayload)
      if (decoded && signature === sign(encodedPayload) && decoded.slug === slug && decoded.sessionId === sessionId) {
        return decoded
      }
    }
  }

  const payload = {
    slug,
    sessionId,
    issuedAt: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex'),
  }
  const encodedPayload = encodePayload(payload)
  const signature = sign(encodedPayload)
  setCookie(event, cookieName, `${encodedPayload}.${signature}`, getCookieOptions(VOTE_INTENT_MAX_AGE))

  return payload
}

export function validateVoteIntent(event: H3Event, slug: string, sessionId: string) {
  const raw = getCookie(event, getIntentCookieName(slug))
  if (!raw) {
    return {
      ok: false,
      statusCode: 428,
      statusMessage: 'Ouvrez la fiche de la communauté avant de voter.',
    }
  }

  const [encodedPayload, signature] = raw.split('.')
  const decoded = encodedPayload
    ? decodePayload<{ slug: string; sessionId: string; issuedAt: number }>(encodedPayload)
    : null

  if (!encodedPayload || !signature || !decoded || sign(encodedPayload) !== signature) {
    return {
      ok: false,
      statusCode: 400,
      statusMessage: 'Jeton de vote invalide. Rechargez la page.',
    }
  }

  if (decoded.slug !== slug || decoded.sessionId !== sessionId) {
    return {
      ok: false,
      statusCode: 400,
      statusMessage: 'Contexte de vote invalide. Rechargez la page.',
    }
  }

  const ageMs = Date.now() - decoded.issuedAt
  if (ageMs < MIN_VOTE_VIEW_MS) {
    return {
      ok: false,
      statusCode: 429,
      statusMessage: 'Patientez quelques secondes sur la fiche avant de voter.',
    }
  }

  if (ageMs > VOTE_INTENT_MAX_AGE * 1000) {
    return {
      ok: false,
      statusCode: 400,
      statusMessage: 'Session de vote expirée. Rechargez la page.',
    }
  }

  return { ok: true }
}

export function clearVoteIntent(event: H3Event, slug: string) {
  deleteCookie(event, getIntentCookieName(slug), {
    path: '/',
  })
}

export function getVoteHashes(event: H3Event, sessionId: string) {
  const ip = normalizeIp(getRequestIP(event, { xForwardedFor: true }))
  const userAgent = (event.node.req.headers['user-agent'] || 'unknown').toString().slice(0, 512)
  const acceptLanguage = (event.node.req.headers['accept-language'] || 'unknown').toString().slice(0, 128)

  return {
    sessionId,
    ipHash: sha256(`${getVoteSecret()}:ip:${ip}`),
    fingerprintHash: sha256(`${getVoteSecret()}:fingerprint:${ip}|${userAgent}|${acceptLanguage}`),
  }
}
