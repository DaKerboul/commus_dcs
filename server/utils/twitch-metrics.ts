/**
 * Deriving session and daily figures from raw samples.
 *
 * Sessions are maintained incrementally (running sums on the session row), so
 * these helpers stay pure: they take counters in and give figures out, with no
 * database access. That is what makes the arithmetic testable.
 */

/** Minutes between polls. Drives how a sample count converts to airtime. */
export const POLL_INTERVAL_MINUTES = 5

export interface SessionCounters {
  startedAt: Date
  lastSeenAt: Date
  sampleCount: number
  dcsSampleCount: number
  viewerSum: number
  peakViewers: number
}

export interface SessionMetrics {
  durationMinutes: number
  dcsMinutes: number
  avgViewers: number
  peakViewers: number
}

/**
 * Figures for one session.
 *
 * Duration comes from the clock (exact start from Twitch → last sighting)
 * rather than from the sample count, so a missed poll shortens the estimate
 * instead of erasing the time. DCS minutes, by contrast, can only come from
 * counting samples that were on DCS — the clock cannot tell which game was on.
 */
export function computeSessionMetrics(counters: SessionCounters): SessionMetrics {
  const spanMs = counters.lastSeenAt.getTime() - counters.startedAt.getTime()
  const durationMinutes = Math.max(0, Math.round(spanMs / 60_000))

  const dcsMinutes = Math.min(
    durationMinutes,
    counters.dcsSampleCount * POLL_INTERVAL_MINUTES,
  )

  const avgViewers = counters.sampleCount > 0
    ? Math.round(counters.viewerSum / counters.sampleCount)
    : 0

  return {
    durationMinutes,
    dcsMinutes,
    avgViewers,
    peakViewers: counters.peakViewers,
  }
}

/**
 * A session is considered over once it has gone unseen for more than two poll
 * intervals — one missed poll is a hiccup, two in a row means offline.
 */
export function isSessionStale(lastSeenAt: Date, now = new Date()): boolean {
  const staleAfterMs = POLL_INTERVAL_MINUTES * 2 * 60_000
  return now.getTime() - lastSeenAt.getTime() > staleAfterMs
}

export interface DailyAccumulator {
  dcsMinutes: number
  totalMinutes: number
  sessions: number
  peakViewers: number
  viewerSum: number
  sampleCount: number
}

/** Folds a session's figures into a day's running totals. */
export function accumulateDaily(
  acc: DailyAccumulator,
  session: SessionMetrics & { sampleCount: number; viewerSum: number },
): DailyAccumulator {
  return {
    dcsMinutes: acc.dcsMinutes + session.dcsMinutes,
    totalMinutes: acc.totalMinutes + session.durationMinutes,
    sessions: acc.sessions + 1,
    peakViewers: Math.max(acc.peakViewers, session.peakViewers),
    viewerSum: acc.viewerSum + session.viewerSum,
    sampleCount: acc.sampleCount + session.sampleCount,
  }
}

export const EMPTY_DAILY: DailyAccumulator = {
  dcsMinutes: 0,
  totalMinutes: 0,
  sessions: 0,
  peakViewers: 0,
  viewerSum: 0,
  sampleCount: 0,
}

/** Average viewers across every sample of the day, not an average of averages. */
export function dailyAvgViewers(acc: DailyAccumulator): number {
  return acc.sampleCount > 0 ? Math.round(acc.viewerSum / acc.sampleCount) : 0
}

/** "3h37m0s" (Twitch VOD format) → minutes. Returns null if unparseable. */
export function parseVodDuration(duration: unknown): number | null {
  if (typeof duration !== 'string') return null

  const match = duration.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!match || (!match[1] && !match[2] && !match[3])) return null

  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2] ?? 0)
  const seconds = Number(match[3] ?? 0)

  return hours * 60 + minutes + Math.round(seconds / 60)
}
