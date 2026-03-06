/**
 * GET /api/streamers — List all known DCS FR streamers with aggregate stats.
 */
import { eq, sql, desc, asc } from 'drizzle-orm'
import { streamers, streamSessions, communities } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)

  const sort = (query.sort as string) || 'live'
  const search = (query.search as string) || ''

  // Fetch streamers with aggregated session data
  const rawStreamers = await db
    .select({
      id: streamers.id,
      twitchLogin: streamers.twitchLogin,
      displayName: streamers.displayName,
      description: streamers.description,
      profileImageUrl: streamers.profileImageUrl,
      isLive: streamers.isLive,
      currentViewers: streamers.currentViewers,
      lastStreamTitle: streamers.lastStreamTitle,
      lastStreamStartedAt: streamers.lastStreamStartedAt,
      communityId: streamers.communityId,
      totalSessions: sql<number>`COALESCE((
        SELECT COUNT(*)::int FROM stream_sessions ss
        WHERE ss.streamer_id = ${streamers.id}
      ), 0)`,
      totalStreamSeconds: sql<number>`COALESCE((
        SELECT SUM(ss.duration_seconds)::int FROM stream_sessions ss
        WHERE ss.streamer_id = ${streamers.id} AND ss.duration_seconds IS NOT NULL
      ), 0)`,
      avgViewers: sql<number>`COALESCE((
        SELECT AVG(COALESCE(ss.max_viewers, ss.avg_viewers, 0))::int FROM stream_sessions ss
        WHERE ss.streamer_id = ${streamers.id}
      ), 0)`,
    })
    .from(streamers)
    .where(eq(streamers.isActive, true))

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
      totalStreamHours: Math.round((s.totalStreamSeconds / 3600) * 10) / 10,
      totalSessions: s.totalSessions,
      avgViewers: s.avgViewers,
      communityName: comm?.name ?? null,
      communitySlug: comm?.slug ?? null,
    }
  })

  // Search filter
  if (search) {
    const q = search.toLowerCase()
    result = result.filter(
      s =>
        s.displayName.toLowerCase().includes(q) ||
        s.twitchLogin.toLowerCase().includes(q),
    )
  }

  // Sort
  switch (sort) {
    case 'hours':
      result.sort((a, b) => b.totalStreamHours - a.totalStreamHours)
      break
    case 'sessions':
      result.sort((a, b) => b.totalSessions - a.totalSessions)
      break
    case 'viewers':
      result.sort((a, b) => b.avgViewers - a.avgViewers)
      break
    case 'name':
      result.sort((a, b) => a.displayName.localeCompare(b.displayName))
      break
    case 'live':
    default:
      // Live first, then by total hours
      result.sort((a, b) => {
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1
        if (a.isLive && b.isLive) return b.currentViewers - a.currentViewers
        return b.totalStreamHours - a.totalStreamHours
      })
  }

  return { data: result, total: result.length }
})
