/**
 * GET /api/streamers/:login — Streamer detail with DCS activity calendar.
 */
import { eq, and, gte, sql } from 'drizzle-orm'
import { streamers, streamerDcsDays, communities } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const login = getRouterParam(event, 'login')
  if (!login) throw createError({ statusCode: 400, statusMessage: 'Login requis' })

  const db = useDB()

  // Fetch streamer
  const [streamer] = await db
    .select()
    .from(streamers)
    .where(eq(streamers.twitchLogin, login.toLowerCase()))
    .limit(1)

  if (!streamer) {
    throw createError({ statusCode: 404, statusMessage: 'Streameur non trouvé' })
  }

  // Community link
  let communityInfo: { name: string; slug: string } | null = null
  if (streamer.communityId) {
    const [comm] = await db
      .select({ name: communities.name, slug: communities.slug })
      .from(communities)
      .where(eq(communities.id, streamer.communityId))
      .limit(1)
    if (comm) communityInfo = comm
  }

  // Fetch DCS days (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const sixMonthsStr = sixMonthsAgo.toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' })

  const dcsDays = await db
    .select({ date: streamerDcsDays.date })
    .from(streamerDcsDays)
    .where(
      and(
        eq(streamerDcsDays.streamerId, streamer.id),
        gte(streamerDcsDays.date, sixMonthsStr),
      ),
    )
    .orderBy(streamerDcsDays.date)

  // Total DCS days (all time)
  const [totalCount] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(streamerDcsDays)
    .where(eq(streamerDcsDays.streamerId, streamer.id))

  // Calendar heatmap: list of dates where streamer was active on DCS
  const calendarHeatmap = dcsDays.map(d => ({ date: d.date, active: true }))

  return {
    id: streamer.id,
    twitchId: streamer.twitchId,
    twitchLogin: streamer.twitchLogin,
    displayName: streamer.displayName,
    description: streamer.description,
    profileImageUrl: streamer.profileImageUrl,
    isLive: streamer.isLive ?? false,
    currentViewers: streamer.currentViewers ?? 0,
    lastStreamTitle: streamer.lastStreamTitle,
    lastStreamStartedAt: streamer.lastStreamStartedAt?.toISOString() ?? null,
    dcsDays: totalCount?.count ?? 0,
    communityName: communityInfo?.name ?? null,
    communitySlug: communityInfo?.slug ?? null,
    calendarHeatmap,
  }
})
