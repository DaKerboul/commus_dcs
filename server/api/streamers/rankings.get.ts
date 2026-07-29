import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { communities, streamerDailyStats, streamers } from '#server/db/schema'

/**
 * GET /api/streamers/rankings?days=30 — leaderboards for the French DCS scene.
 *
 * Ranked on DCS time rather than total airtime: this is a DCS directory, and a
 * streamer who spent the month on another game should not top the table.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const days = Math.min(365, Math.max(1, parseInt(String(query.days ?? '30'), 10) || 30))

  const since = new Date(Date.now() - days * 24 * 60 * 60_000).toISOString().slice(0, 10)
  const db = useDB()

  const rows = await db
    .select({
      streamerId: streamerDailyStats.streamerId,
      login: streamers.twitchLogin,
      displayName: streamers.displayName,
      avatarUrl: streamers.profileImageUrl,
      isLive: streamers.isLive,
      followers: streamers.followers,
      communityName: communities.name,
      communitySlug: communities.slug,
      dcsMinutes: sql<number>`SUM(${streamerDailyStats.dcsMinutes})::int`,
      totalMinutes: sql<number>`SUM(${streamerDailyStats.totalMinutes})::int`,
      sessions: sql<number>`SUM(${streamerDailyStats.sessions})::int`,
      activeDays: sql<number>`COUNT(*) FILTER (WHERE ${streamerDailyStats.totalMinutes} > 0)::int`,
      peakViewers: sql<number>`MAX(${streamerDailyStats.peakViewers})::int`,
      // Weighted by airtime: a 6-hour stream should count more than a 20-minute one.
      avgViewers: sql<number>`
        CASE WHEN SUM(${streamerDailyStats.totalMinutes}) > 0
             THEN (SUM(${streamerDailyStats.avgViewers} * ${streamerDailyStats.totalMinutes})
                   / SUM(${streamerDailyStats.totalMinutes}))::int
             ELSE 0 END`,
    })
    .from(streamerDailyStats)
    .innerJoin(streamers, eq(streamerDailyStats.streamerId, streamers.id))
    .leftJoin(communities, eq(streamers.communityId, communities.id))
    .where(and(
      gte(streamerDailyStats.day, since),
      eq(streamers.isActive, true),
      eq(streamers.isFrench, true),
    ))
    .groupBy(
      streamerDailyStats.streamerId,
      streamers.twitchLogin,
      streamers.displayName,
      streamers.profileImageUrl,
      streamers.isLive,
      streamers.followers,
      communities.name,
      communities.slug,
    )
    .orderBy(desc(sql`SUM(${streamerDailyStats.dcsMinutes})`))

  const withRegularity = rows.map(row => ({
    ...row,
    regularity: Math.round((row.activeDays / days) * 100),
  }))

  const scene = {
    days,
    streamers: withRegularity.length,
    dcsHours: Math.round(withRegularity.reduce((t, r) => t + r.dcsMinutes, 0) / 60),
    totalHours: Math.round(withRegularity.reduce((t, r) => t + r.totalMinutes, 0) / 60),
    sessions: withRegularity.reduce((t, r) => t + r.sessions, 0),
  }

  return {
    scene,
    byDcsTime: withRegularity.slice(0, 25),
    byViewers: [...withRegularity].sort((a, b) => b.avgViewers - a.avgViewers).slice(0, 25),
    byRegularity: [...withRegularity]
      // One long session in 30 days is not regularity; require a real habit.
      .filter(r => r.activeDays >= 3)
      .sort((a, b) => b.regularity - a.regularity)
      .slice(0, 25),
    byFollowers: [...withRegularity]
      .filter(r => (r.followers ?? 0) > 0)
      .sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))
      .slice(0, 25),
  }
})
