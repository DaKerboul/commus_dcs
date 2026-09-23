// Discord invite health. A fiche's main call to action is "join the Discord",
// and 12 of 59 links were found dead on 2026-09-23 — mostly temporary invites
// (7-day default) that silently expired.

export type InviteStatus = 'ok' | 'temporary' | 'dead' | 'unknown'

const INVITE_RE = /^https?:\/\/(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/([A-Za-z0-9-]{2,64})\/?(?:[?#].*)?$/i
const TIMEOUT_MS = 8000

export function extractInviteCode(url: string | null | undefined): string | null {
  if (!url) return null
  return INVITE_RE.exec(url.trim())?.[1] ?? null
}

export interface InviteCheck {
  status: InviteStatus
  /** Seconds to wait when Discord rate-limits us (status 'unknown'). */
  retryAfter?: number
}

export async function checkInvite(code: string): Promise<InviteCheck> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_expiration=true`, {
      signal: controller.signal,
      headers: { 'user-agent': 'CommusDCS (https://commus.kerboul.me)' },
    })
    if (res.status === 404) return { status: 'dead' }
    if (res.status === 429) {
      const body = await res.json().catch(() => ({})) as { retry_after?: number }
      return { status: 'unknown', retryAfter: Math.ceil(body.retry_after ?? 5) }
    }
    if (!res.ok) return { status: 'unknown' }
    const body = await res.json().catch(() => ({})) as { expires_at?: string | null }
    return { status: body.expires_at ? 'temporary' : 'ok' }
  } catch {
    return { status: 'unknown' }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Rejects links that would ship a broken call to action. Network trouble or a
 * Discord outage ('unknown') never blocks a submission.
 */
export async function assertUsableDiscordInvite(url: string | null): Promise<void> {
  if (!url) return
  const code = extractInviteCode(url)
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Lien Discord invalide : utilisez un lien d\'invitation du type https://discord.gg/xxxx' })
  }
  const { status } = await checkInvite(code)
  if (status === 'dead') {
    throw createError({ statusCode: 400, statusMessage: 'Cette invitation Discord est expirée ou invalide.' })
  }
  if (status === 'temporary') {
    throw createError({ statusCode: 400, statusMessage: 'Cette invitation Discord est temporaire : créez une invitation qui n\'expire jamais (Paramètres de l\'invitation → Expire après : Jamais).' })
  }
}

/** Hides the Discord button only while the dead status still applies to the current link. */
export function liveDiscordUrl(row: { discordUrl: string | null, discordStatus?: string | null, discordStatusUrl?: string | null }): string | null {
  if (!row.discordUrl) return null
  if (row.discordStatus === 'dead' && row.discordStatusUrl === row.discordUrl) return null
  return row.discordUrl
}
