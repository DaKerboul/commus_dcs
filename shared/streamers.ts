/**
 * Pure helpers for the streamers section, shared by the API and the tests.
 * Spec: docs/superpowers/specs/2026-09-26-streameurs-design.md.
 */

const DAY_NAMES = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.']

export interface UsualSlot {
  /** ISO weekdays, 1 = Monday. */
  days: number[]
  /** Minutes after midnight, Paris time, rounded to the half hour. */
  minutes: number
  /** "Souvent le mer. et ven. vers 21 h". */
  label: string
}

/** Weekday (1–7) and minutes after midnight of a date, in Paris time. */
function parisClock(date: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday')) + 1
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

/**
 * When a streamer usually goes live, from their recent session starts.
 *
 * Needs at least 3 sessions: fewer is an anecdote, not a habit. The hour is the
 * median start (robust to the odd afternoon stream), and a weekday counts as
 * usual when it holds at least a quarter of the sessions.
 */
export function usualSlot(starts: Date[]): UsualSlot | null {
  if (starts.length < 3) return null

  const clocks = starts.map(parisClock)
  // Past midnight counts as the evening before: a 00:30 start belongs to a 21 h
  // habit, not to a morning one.
  const evening = clocks.map(c => (c.minutes < 5 * 60 ? c.minutes + 24 * 60 : c.minutes)).sort((a, b) => a - b)
  const median = evening[Math.floor(evening.length / 2)]!
  const minutes = (Math.round(median / 30) * 30) % (24 * 60)

  const perDay = new Map<number, number>()
  for (const c of clocks) perDay.set(c.day, (perDay.get(c.day) ?? 0) + 1)
  const days = [...perDay]
    .filter(([, n]) => n >= Math.max(2, starts.length / 4))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d]) => d)
    .sort((a, b) => a - b)

  const when = days.length === 0 ? ''
    : days.length === 1 ? ` le ${DAY_NAMES[days[0]! - 1]}`
      : ` le ${days.slice(0, -1).map(d => DAY_NAMES[d - 1]).join(', ')} et ${DAY_NAMES[days.at(-1)! - 1]}`

  return { days, minutes, label: `Souvent${when} vers ${formatClock(minutes)}` }
}

/** Today's ISO weekday in Paris. */
export function parisWeekday(now = new Date()): number {
  return parisClock(now).day
}

// ── Link suggestions ──────────────────────────────────

export interface SuggestionCommunity {
  name: string
  slug: string
  /** Twitch login declared on the fiche, if any. */
  twitchLogin: string | null
}

export interface SuggestionStreamer {
  id: number
  login: string
  description: string | null
  /** Titles of recent DCS sessions. */
  titles: string[]
}

export interface StreamerSuggestion {
  streamerId: number
  /** How many titles (or the description) cite the community. */
  mentions: number
  /** Why it is suggested, for the person confirming. */
  evidence: string
}

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * The ways a community is written in stream titles: its name, its slug, and the
 * slug with spaces — all at least 4 characters, matched as whole words so that
 * "vap" never matches "vapeur".
 */
function patterns(c: SuggestionCommunity): RegExp[] {
  const names = new Set<string>()
  const add = (s: string) => {
    const f = fold(s).trim()
    if (f.length >= 4) names.add(f)
  }
  add(c.name)
  // "Escadrille Couteau (EC)" is written "Escadrille Couteau".
  add(c.name.replace(/\s*[([].*?[)\]]\s*/g, ' '))
  add(c.slug)
  add(c.slug.replace(/-/g, ' '))

  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return [...names].map(n => new RegExp(`(^|[^a-z0-9])${escape(n)}([^a-z0-9]|$)`))
}

/**
 * Channels that look like they stream for a community — suggestions only, a
 * person always confirms (a streamer citing a community may just have joined
 * one of its events).
 */
export function suggestStreamers(
  community: SuggestionCommunity,
  candidates: SuggestionStreamer[],
  excludedIds: Set<number>,
): StreamerSuggestion[] {
  const res = patterns(community)
  const cites = (text: string | null) => !!text && res.some(re => re.test(fold(text)))

  const out: StreamerSuggestion[] = []
  for (const s of candidates) {
    if (excludedIds.has(s.id)) continue

    if (community.twitchLogin && s.login.toLowerCase() === community.twitchLogin) {
      out.push({ streamerId: s.id, mentions: 99, evidence: 'Chaîne Twitch indiquée sur la fiche' })
      continue
    }

    const citing = s.titles.filter(cites)
    const inBio = cites(s.description)
    if (!citing.length && !inBio) continue

    out.push({
      streamerId: s.id,
      mentions: citing.length + (inBio ? 1 : 0),
      evidence: citing.length
        ? `Citée dans ${citing.length} stream${citing.length > 1 ? 's' : ''}, dont « ${citing[0]} »`
        : 'Citée dans la description de la chaîne',
    })
  }
  return out.sort((a, b) => b.mentions - a.mentions)
}

// ── Formatting ────────────────────────────────────────

/** Twitch VOD duration ("3h12m45s") as "3 h 12". */
export function formatTwitchDuration(raw: string | null | undefined): string | null {
  const m = raw?.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!raw || !m) return null
  const h = Number(m[1] ?? 0)
  const min = Number(m[2] ?? 0)
  return h ? `${h} h ${String(min).padStart(2, '0')}` : `${min} min`
}

/** "il y a 2 h", "il y a 3 j" — short, for thumbnails. */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000))
  if (minutes < 60) return `il y a ${minutes} min`
  if (minutes < 24 * 60) return `il y a ${Math.round(minutes / 60)} h`
  return `il y a ${Math.round(minutes / (24 * 60))} j`
}
