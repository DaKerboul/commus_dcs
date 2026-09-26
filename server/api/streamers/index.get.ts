/**
 * GET /api/streamers — every tracked channel, with DCS activity and communities.
 * Used by the channel search (editor, admin) and the admin dashboard.
 */
import { eq, sql } from 'drizzle-orm'
import { streamers, streamerDcsDays } from '#server/db/schema'
import { DCS_GAME_ID } from '#server/utils/twitch'

export default defineEventHandler(async () => {
  const db = useDB()

  const [rawStreamers, daysRows, minutes] = await Promise.all([
    db.select().from(streamers).where(eq(streamers.isActive, true)),
    db.select({ streamerId: streamerDcsDays.streamerId, dcsDays: sql<number>`COUNT(*)::int` })
      .from(streamerDcsDays)
      .groupBy(streamerDcsDays.streamerId),
    dcsMinutes30d(),
  ])

  const daysMap = new Map(daysRows.map(r => [r.streamerId, r.dcsDays]))
  const badges = await communitiesByStreamer(rawStreamers.map(s => s.id))

  /** Live *and* on DCS — the only sense in which this site says "en direct". */
  const isLiveOnDcs = (s: { isLive: boolean | null; currentGameId: string | null }) =>
    (s.isLive ?? false) && s.currentGameId === DCS_GAME_ID

  const result = rawStreamers.map((s) => {
    const communities = badges.get(s.id) ?? []
    return {
      id: s.id,
      twitchLogin: s.twitchLogin,
      displayName: s.displayName,
      profileImageUrl: s.profileImageUrl,
      isLive: isLiveOnDcs(s),
      isLiveOffTopic: (s.isLive ?? false) && !isLiveOnDcs(s),
      currentViewers: s.currentViewers ?? 0,
      lastStreamTitle: s.lastStreamTitle,
      lastStreamStartedAt: s.lastStreamStartedAt?.toISOString() ?? null,
      dcsDays: daysMap.get(s.id) ?? 0,
      dcsMinutes30d: minutes.get(s.id) ?? 0,
      communities,
      communityName: communities[0]?.name ?? null,
      communitySlug: communities[0]?.slug ?? null,
    }
  })

  result.sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1
    if (a.isLive && b.isLive) return b.currentViewers - a.currentViewers
    return b.dcsMinutes30d - a.dcsMinutes30d || b.dcsDays - a.dcsDays
  })

  return { data: result, total: result.length }
})
