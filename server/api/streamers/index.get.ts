/**
 * GET /api/streamers — List all known DCS FR streamers with DCS activity stats.
 */
import { eq, sql } from 'drizzle-orm'
import { streamers, streamerDcsDays, communities } from '#server/db/schema'

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

  // Map to response
  let result = rawStreamers.map(s => {
    const comm = s.communityId ? communityMap.get(s.communityId) : null
    return {
      id: s.id,
      twitchLogin: s.twitchLogin,
      displayName: s.displayName,
      profileImageUrl: s.profileImageUrl,
      isLive: s.isLive ?? false,
      currentViewers: s.currentViewers ?? 0,
      lastStreamTitle: s.lastStreamTitle,
      lastStreamStartedAt: s.lastStreamStartedAt?.toISOString() ?? null,
      dcsDays: daysMap.get(s.id) ?? 0,
      communityName: comm?.name ?? null,
      communitySlug: comm?.slug ?? null,
    }
  })

  // Default sort: live first, then by DCS days
  result.sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1
    if (a.isLive && b.isLive) return b.currentViewers - a.currentViewers
    return b.dcsDays - a.dcsDays
  })

  return { data: result, total: result.length }
})
