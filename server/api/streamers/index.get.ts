/**
 * GET /api/streamers — List all known DCS FR streamers with DCS activity stats.
 */
import { eq, sql } from 'drizzle-orm'
import { streamers, streamerDcsDays, communities } from '#server/db/schema'
import { DCS_GAME_ID } from '#server/utils/twitch'

export default defineEventHandler(async (event) => {
  const db = useDB()

  // 1. Fetch active streamers
  const rawStreamers = await db
    .select()
    .from(streamers)
    .where(eq(streamers.isActive, true))

  // 2. Aggregate DCS days per streamer
  const daysRows = await db
    .select({
      streamerId: streamerDcsDays.streamerId,
      dcsDays: sql<number>`COUNT(*)::int`,
    })
    .from(streamerDcsDays)
    .groupBy(streamerDcsDays.streamerId)

  const daysMap = new Map(daysRows.map(r => [r.streamerId, r.dcsDays]))

  // Get community names for linked streamers
  const communityIds = rawStreamers
    .map(s => s.communityId)
    .filter((id): id is number => id !== null)

  let communityMap = new Map<number, { name: string; slug: string }>()
  if (communityIds.length > 0) {
    const comms = await db
      .select({ id: communities.id, name: communities.name, slug: communities.slug })
      .from(communities)
      .where(sql`${communities.id} IN (${sql.join(communityIds.map(id => sql`${id}`), sql`,`)})`)
    communityMap = new Map(comms.map(c => [c.id, { name: c.name, slug: c.slug }]))
  }

  /** Live *and* on DCS — the only sense in which this site says "en direct". */
  const isLiveOnDcs = (s: { isLive: boolean | null; currentGameId: string | null }) =>
    (s.isLive ?? false) && s.currentGameId === DCS_GAME_ID

  // Map to response
  let result = rawStreamers.map(s => {
    const comm = s.communityId ? communityMap.get(s.communityId) : null
    return {
      id: s.id,
      twitchLogin: s.twitchLogin,
      displayName: s.displayName,
      profileImageUrl: s.profileImageUrl,
      // `isLive` covers any game, so the DCS badge keys off isLiveOnDcs.
      // Without that split a sim-racing stream would read as a live DCS stream.
      isLive: isLiveOnDcs(s),
      isLiveOffTopic: (s.isLive ?? false) && !isLiveOnDcs(s),
      currentViewers: s.currentViewers ?? 0,
      lastStreamTitle: s.lastStreamTitle,
      lastStreamStartedAt: s.lastStreamStartedAt?.toISOString() ?? null,
      dcsDays: daysMap.get(s.id) ?? 0,
      communityName: comm?.name ?? null,
      communitySlug: comm?.slug ?? null,
    }
  })

  // Live on DCS first, then by DCS activity. Streaming something else earns no
  // ranking boost here.
  result.sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1
    if (a.isLive && b.isLive) return b.currentViewers - a.currentViewers
    return b.dcsDays - a.dcsDays
  })

  return { data: result, total: result.length }
})
