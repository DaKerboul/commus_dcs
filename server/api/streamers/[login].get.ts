/**
 * GET /api/streamers/:login — Streamer detail with DCS activity calendar.
 */
import { eq, and, gte, desc, sql } from 'drizzle-orm'
import {
  streamers,
  streamerDcsDays,
  streamerDailyStats,
  streamerFollowerHistory,
  streamerSessions,
  communities,
} from '#server/db/schema'
import { computeSessionMetrics } from '#server/utils/twitch-metrics'

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

  // Last DCS date = most recent entry in streamerDcsDays (already sorted by date ASC)
  const lastDcsDate = dcsDays.length > 0 ? dcsDays[dcsDays.length - 1]!.date : null

  // ── Sampled statistics (see docs/etude-stats-twitch.md) ──
  // Everything below exists only because we sample live: Twitch keeps no history.

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60_000)

  const [recentSessions, dailyStats, followerCurve] = await Promise.all([
    db.select().from(streamerSessions)
      .where(eq(streamerSessions.streamerId, streamer.id))
      .orderBy(desc(streamerSessions.startedAt))
      .limit(20),
    db.select().from(streamerDailyStats)
      .where(eq(streamerDailyStats.streamerId, streamer.id))
      .orderBy(streamerDailyStats.day),
    db.select().from(streamerFollowerHistory)
      .where(eq(streamerFollowerHistory.streamerId, streamer.id))
      .orderBy(streamerFollowerHistory.day),
  ])

  const sessions = recentSessions.map((session) => {
    const metrics = computeSessionMetrics({
      startedAt: session.startedAt,
      lastSeenAt: session.lastSeenAt,
      sampleCount: session.sampleCount,
      dcsSampleCount: session.dcsSampleCount,
      viewerSum: session.viewerSum,
      peakViewers: session.peakViewers,
    })

    return {
      streamId: session.streamId,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.isLive ? null : session.lastSeenAt.toISOString(),
      isLive: session.isLive,
      titles: session.titles ?? [],
      vodUrl: session.vodUrl,
      vodViewCount: session.vodViewCount,
      ...metrics,
    }
  })

  const recentDaily = dailyStats.filter(d => d.day >= ninetyDaysAgo.toISOString().slice(0, 10))
  const sum = (key: 'dcsMinutes' | 'totalMinutes' | 'sessions') =>
    recentDaily.reduce((total, day) => total + (day[key] ?? 0), 0)

  // Regularity over the window we actually have data for, so a streamer tracked
  // for a week is not penalised against one tracked for three months.
  const trackedDays = recentDaily.length
    ? Math.max(1, Math.ceil((Date.now() - new Date(recentDaily[0]!.day).getTime()) / 86_400_000))
    : 0
  const activeDays = recentDaily.filter(d => d.totalMinutes > 0).length

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
    lastDcsDate,
    dcsDays: totalCount?.count ?? 0,
    communityName: communityInfo?.name ?? null,
    communitySlug: communityInfo?.slug ?? null,
    calendarHeatmap,

    followers: streamer.followers,
    broadcasterType: streamer.broadcasterType,
    stats: {
      dcsMinutes90d: sum('dcsMinutes'),
      totalMinutes90d: sum('totalMinutes'),
      sessions90d: sum('sessions'),
      peakViewers90d: Math.max(0, ...recentDaily.map(d => d.peakViewers ?? 0)),
      avgViewers90d: recentDaily.length
        ? Math.round(recentDaily.reduce((t, d) => t + (d.avgViewers ?? 0), 0) / recentDaily.length)
        : 0,
      activeDays,
      trackedDays,
      regularity: trackedDays > 0 ? Math.round((activeDays / trackedDays) * 100) : 0,
    },
    sessions,
    daily: recentDaily.map(d => ({
      day: d.day,
      dcsMinutes: d.dcsMinutes,
      totalMinutes: d.totalMinutes,
      peakViewers: d.peakViewers,
      avgViewers: d.avgViewers,
    })),
    followerCurve: followerCurve.map(f => ({ day: f.day, followers: f.followers })),
  }
})
