import { and, eq, gte, lt, sql } from 'drizzle-orm'
import {
  streamerDailyStats,
  streamerFollowerHistory,
  streamerSamples,
  streamerSessions,
  streamers,
} from '#server/db/schema'
import { fetchChannelInfo, fetchFollowerCount, fetchTwitchUsersByIds, fetchVideos } from './twitch'
import { classifyFrench } from './twitch-french'
import {
  EMPTY_DAILY,
  accumulateDaily,
  computeSessionMetrics,
  dailyAvgViewers,
} from './twitch-metrics'

/** Raw samples are dropped after this; daily rollups are kept forever. */
const SAMPLE_RETENTION_DAYS = 90

function parisDay(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Rebuilds the daily rollup for `day` from that day's sessions.
 *
 * Recomputed from scratch rather than incremented, so a re-run after a fix or a
 * missed pass converges instead of double-counting.
 */
export async function rollupDay(day: string): Promise<number> {
  const db = useDB()

  const dayStart = new Date(`${day}T00:00:00Z`)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60_000)

  const sessions = await db.select().from(streamerSessions).where(and(
    gte(streamerSessions.startedAt, dayStart),
    lt(streamerSessions.startedAt, dayEnd),
  ))

  const byStreamer = new Map<number, ReturnType<typeof accumulateDaily>>()

  for (const session of sessions) {
    const metrics = computeSessionMetrics({
      startedAt: session.startedAt,
      lastSeenAt: session.lastSeenAt,
      sampleCount: session.sampleCount,
      dcsSampleCount: session.dcsSampleCount,
      viewerSum: session.viewerSum,
      peakViewers: session.peakViewers,
    })

    const current = byStreamer.get(session.streamerId) ?? EMPTY_DAILY
    byStreamer.set(session.streamerId, accumulateDaily(current, {
      ...metrics,
      sampleCount: session.sampleCount,
      viewerSum: session.viewerSum,
    }))
  }

  for (const [streamerId, acc] of byStreamer) {
    await db.insert(streamerDailyStats).values({
      streamerId,
      day,
      dcsMinutes: acc.dcsMinutes,
      totalMinutes: acc.totalMinutes,
      sessions: acc.sessions,
      peakViewers: acc.peakViewers,
      avgViewers: dailyAvgViewers(acc),
    }).onConflictDoUpdate({
      target: [streamerDailyStats.streamerId, streamerDailyStats.day],
      set: {
        dcsMinutes: acc.dcsMinutes,
        totalMinutes: acc.totalMinutes,
        sessions: acc.sessions,
        peakViewers: acc.peakViewers,
        avgViewers: dailyAvgViewers(acc),
      },
    })
  }

  return byStreamer.size
}

/**
 * Daily follower snapshot.
 *
 * Reading the total with an app token is undocumented behaviour, so a null is
 * treated as "not available today" and simply skipped — never as an error.
 */
export async function syncFollowers(): Promise<{ updated: number; unavailable: number }> {
  const db = useDB()
  const tracked = await db.select().from(streamers).where(and(
    eq(streamers.isActive, true),
    eq(streamers.isFrench, true),
  ))

  const today = parisDay()
  let updated = 0
  let unavailable = 0

  for (const streamer of tracked) {
    const total = await fetchFollowerCount(streamer.twitchId)

    if (total === null) {
      unavailable++
      continue
    }

    await db.insert(streamerFollowerHistory)
      .values({ streamerId: streamer.id, day: today, followers: total })
      .onConflictDoUpdate({
        target: [streamerFollowerHistory.streamerId, streamerFollowerHistory.day],
        set: { followers: total },
      })

    await db.update(streamers)
      .set({ followers: total, updatedAt: new Date() })
      .where(eq(streamers.id, streamer.id))

    updated++
  }

  console.log(JSON.stringify({ event: 'twitch.followers', updated, unavailable }))
  return { updated, unavailable }
}

/** Refreshes profiles and re-runs the French classifier on channel metadata. */
export async function refreshProfilesAndLanguage(): Promise<number> {
  const db = useDB()
  const tracked = await db.select().from(streamers).where(eq(streamers.isActive, true))
  if (!tracked.length) return 0

  const ids = tracked.map(s => s.twitchId)
  const [users, channels] = await Promise.all([
    fetchTwitchUsersByIds(ids),
    fetchChannelInfo(ids),
  ])

  const userById = new Map(users.map(u => [u.id, u]))
  const channelById = new Map(channels.map(c => [c.broadcaster_id, c]))
  let refreshed = 0

  for (const streamer of tracked) {
    const user = userById.get(streamer.twitchId)
    const channel = channelById.get(streamer.twitchId)
    if (!user && !channel) continue

    const verdict = classifyFrench({
      broadcasterLanguage: channel?.broadcaster_language,
      tags: channel?.tags,
      title: channel?.title,
      override: streamer.frenchOverride,
    })

    await db.update(streamers).set({
      displayName: user?.display_name ?? streamer.displayName,
      description: user?.description ?? streamer.description,
      profileImageUrl: user?.profile_image_url ?? streamer.profileImageUrl,
      broadcasterType: user?.broadcaster_type ?? streamer.broadcasterType,
      broadcasterLanguage: channel?.broadcaster_language ?? streamer.broadcasterLanguage,
      isFrench: verdict.isFrench,
      updatedAt: new Date(),
    }).where(eq(streamers.id, streamer.id))

    refreshed++
  }

  console.log(JSON.stringify({ event: 'twitch.refresh', refreshed }))
  return refreshed
}

/**
 * Attaches VOD metadata to sessions via Twitch's own stream_id.
 * Only recent sessions are worth trying: archives are deleted after 14–60 days.
 */
export async function matchVods(): Promise<number> {
  const db = useDB()
  const since = new Date(Date.now() - 14 * 24 * 60 * 60_000)

  const recent = await db.select().from(streamerSessions).where(and(
    gte(streamerSessions.startedAt, since),
    eq(streamerSessions.isLive, false),
  ))

  if (!recent.length) return 0

  const byStreamer = new Map<number, typeof recent>()
  for (const session of recent) {
    const list = byStreamer.get(session.streamerId) ?? []
    list.push(session)
    byStreamer.set(session.streamerId, list)
  }

  let matched = 0

  for (const [streamerId, sessions] of byStreamer) {
    if (sessions.every(s => s.vodUrl)) continue

    const [streamer] = await db.select().from(streamers).where(eq(streamers.id, streamerId)).limit(1)
    if (!streamer) continue

    const videos = await fetchVideos(streamer.twitchId, 40)
    const videoByStreamId = new Map(videos.filter(v => v.stream_id).map(v => [v.stream_id, v]))

    for (const session of sessions) {
      const video = videoByStreamId.get(session.streamId)
      if (!video || session.vodUrl === video.url) continue

      await db.update(streamerSessions).set({
        vodUrl: video.url,
        vodDuration: video.duration,
        vodViewCount: video.view_count,
      }).where(eq(streamerSessions.id, session.id))

      matched++
    }
  }

  console.log(JSON.stringify({ event: 'twitch.vods', matched }))
  return matched
}

/** Drops raw samples past the retention window. Rollups are unaffected. */
export async function purgeOldSamples(): Promise<number> {
  const db = useDB()
  const cutoff = new Date(Date.now() - SAMPLE_RETENTION_DAYS * 24 * 60 * 60_000)

  const deleted = await db.delete(streamerSamples)
    .where(lt(streamerSamples.observedAt, cutoff))
    .returning({ id: streamerSamples.id })

  if (deleted.length) {
    console.log(JSON.stringify({ event: 'twitch.purge', samples: deleted.length }))
  }

  return deleted.length
}

/** Nightly maintenance: rollups, followers, profiles, VODs, purge. */
export async function runDailyMaintenance(): Promise<void> {
  const today = parisDay()
  const yesterday = parisDay(new Date(Date.now() - 24 * 60 * 60_000))

  // Yesterday may still have been open at the last rollup; redo both.
  await rollupDay(yesterday)
  await rollupDay(today)
  await refreshProfilesAndLanguage()
  await syncFollowers()
  await matchVods()
  await purgeOldSamples()
}
