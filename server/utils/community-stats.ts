import { and, eq, gte, sql } from 'drizzle-orm'
import { communityEvents } from '#server/db/schema'

/** Event types a client may report. Anything else is ignored. */
export const TRACKABLE_EVENTS = [
  'view',
  'click_discord',
  'click_website',
  'click_youtube',
  'click_twitch',
  'click_instagram',
  'click_facebook',
  'click_twitter',
] as const

export type TrackableEvent = typeof TRACKABLE_EVENTS[number]

export function isTrackableEvent(value: unknown): value is TrackableEvent {
  return typeof value === 'string' && (TRACKABLE_EVENTS as readonly string[]).includes(value)
}

/** Today in Paris time, as YYYY-MM-DD — matches how streamer days are keyed. */
export function parisDay(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Adds one to today's counter for (community, type).
 *
 * Best-effort: analytics must never break the page they measure, so failures
 * are logged and swallowed.
 */
export async function recordCommunityEvent(communityId: number, type: TrackableEvent): Promise<void> {
  try {
    const db = useDB()
    await db.insert(communityEvents)
      .values({ communityId, type, day: parisDay(), count: 1 })
      .onConflictDoUpdate({
        target: [communityEvents.communityId, communityEvents.type, communityEvents.day],
        set: { count: sql`${communityEvents.count} + 1` },
      })
  } catch (error) {
    console.error(JSON.stringify({
      event: 'community.track',
      result: 'error',
      communityId,
      message: error instanceof Error ? error.message : String(error),
    }))
  }
}

/** Daily counts per type over the last `days`, for the manager dashboard. */
export async function getCommunityStats(communityId: number, days = 30) {
  const db = useDB()
  const since = parisDay(new Date(Date.now() - days * 24 * 60 * 60 * 1000))

  const rows = await db.select().from(communityEvents)
    .where(and(
      eq(communityEvents.communityId, communityId),
      gte(communityEvents.day, since),
    ))
    .orderBy(communityEvents.day)

  const totals: Record<string, number> = {}
  const daily: Record<string, Record<string, number>> = {}

  for (const row of rows) {
    totals[row.type] = (totals[row.type] ?? 0) + row.count
    daily[row.day] ??= {}
    daily[row.day]![row.type] = row.count
  }

  return { since, totals, daily }
}
