/**
 * GET /api/streamers — List all known DCS FR streamers with aggregate stats.
 */
import { eq, sql } from 'drizzle-orm'
import { streamers, streamSessions, communities } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)

  const sort = (query.sort as string) || 'live'
  const search = (query.search as string) || ''

  // 1. Fetch active streamers
  const rawStreamers = await db
    .select()
    .from(streamers)
    .where(eq(streamers.isActive, true))

  // 2. Aggregate session stats per streamer in a single query
  const statsRows = await db
    .select({
      streamerId: streamSessions.streamerId,
      totalSessions: sql<number>`COUNT(*)::int`,
      totalStreamSeconds: sql<number>`COALESCE(SUM(${streamSessions.durationSeconds}), 0)::int`,
      avgViewers: sql<number>`COALESCE(AVG(COALESCE(${streamSessions.maxViewers}, ${streamSessions.avgViewers}, 0)), 0)::int`,
    })
    .from(streamSessions)
    .groupBy(streamSessions.streamerId)

  const statsMap = new Map(statsRows.map(r => [r.streamerId, r]))

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
    const stats = statsMap.get(s.id)
    return {
      id: s.id,
      twitchLogin: s.twitchLogin,
      displayName: s.displayName,
      profileImageUrl: s.profileImageUrl,
      isLive: s.isLive ?? false,
      currentViewers: s.currentViewers ?? 0,
      lastStreamTitle: s.lastStreamTitle,
      lastStreamStartedAt: s.lastStreamStartedAt?.toISOString() ?? null,
      totalStreamHours: stats ? Math.round((stats.totalStreamSeconds / 3600) * 10) / 10 : 0,
      totalSessions: stats?.totalSessions ?? 0,
      avgViewers: stats?.avgViewers ?? 0,
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
