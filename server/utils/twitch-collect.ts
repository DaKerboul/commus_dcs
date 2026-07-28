import { and, eq, inArray, lt, sql } from 'drizzle-orm'
import {
  streamerDcsDays,
  streamerSamples,
  streamerSessions,
  streamers,
} from '#server/db/schema'
import {
  DCS_GAME_ID,
  fetchAllLiveDcsStreams,
  fetchChannelInfo,
  fetchStreamsByUserIds,
  fetchTwitchUsers,
  type TwitchStream,
} from './twitch'
import { classifyFrench } from './twitch-french'
import { isSessionStale } from './twitch-metrics'

/**
 * Sampling loop.
 *
 * Twitch keeps no history: viewer counts, titles and session boundaries exist
 * only while a stream is live. Every figure the site shows is derived from the
 * samples written here, so a poll that does not run is a permanent gap.
 *
 * Two calls per pass:
 *   1. the whole DCS category (all languages) — discovers newcomers
 *   2. our known streamers by id — catches them on other games, which is what
 *      lets us separate DCS time from total airtime
 */

let collectInProgress = false

function parisDay(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Adds newly seen French streamers and returns how many were created. */
async function discoverFrenchStreamers(streams: TwitchStream[]): Promise<number> {
  const db = useDB()

  const known = await db.select({ twitchId: streamers.twitchId }).from(streamers)
  const knownIds = new Set(known.map(s => s.twitchId))

  const candidates = streams.filter(s => !knownIds.has(s.user_id))
  if (!candidates.length) return 0

  // The stream alone may carry no French signal, so consult the channel too.
  const channels = await fetchChannelInfo(candidates.map(s => s.user_id))
  const channelById = new Map(channels.map(c => [c.broadcaster_id, c]))

  const french = candidates.filter((stream) => {
    const channel = channelById.get(stream.user_id)
    return classifyFrench({
      streamLanguage: stream.language,
      broadcasterLanguage: channel?.broadcaster_language,
      tags: stream.tags ?? channel?.tags,
      title: stream.title,
    }).isFrench
  })

  if (!french.length) return 0

  const users = await fetchTwitchUsers(french.map(s => s.user_login))
  const userById = new Map(users.map(u => [u.id, u]))
  let created = 0

  for (const stream of french) {
    const user = userById.get(stream.user_id)
    const channel = channelById.get(stream.user_id)

    try {
      const inserted = await db.insert(streamers).values({
        twitchId: stream.user_id,
        twitchLogin: stream.user_login,
        displayName: user?.display_name ?? stream.user_name,
        description: user?.description || null,
        profileImageUrl: user?.profile_image_url || null,
        broadcasterLanguage: channel?.broadcaster_language || null,
        broadcasterType: user?.broadcaster_type || null,
        isFrench: true,
      }).onConflictDoNothing().returning({ id: streamers.id })

      if (inserted.length) created++
    } catch (error) {
      console.warn(`[twitch-collect] insertion impossible pour ${stream.user_login}:`, error)
    }
  }

  if (created > 0) {
    console.log(JSON.stringify({
      event: 'twitch.discover',
      created,
      logins: french.map(s => s.user_login),
    }))
  }

  return created
}

/** Writes one sample and folds it into the matching session. */
async function recordSample(streamerId: number, stream: TwitchStream, observedAt: Date): Promise<void> {
  const db = useDB()
  const isDcs = stream.game_id === DCS_GAME_ID
  const viewers = stream.viewer_count ?? 0

  await db.insert(streamerSamples).values({
    streamerId,
    streamId: stream.id,
    observedAt,
    viewerCount: viewers,
    gameId: stream.game_id || null,
    title: stream.title || null,
  }).onConflictDoNothing()

  // Running sums live on the session row, so averages never scan the samples.
  await db.insert(streamerSessions).values({
    streamerId,
    streamId: stream.id,
    startedAt: new Date(stream.started_at),
    lastSeenAt: observedAt,
    isLive: true,
    sampleCount: 1,
    dcsSampleCount: isDcs ? 1 : 0,
    viewerSum: viewers,
    peakViewers: viewers,
    titles: stream.title ? [stream.title] : [],
  }).onConflictDoUpdate({
    target: streamerSessions.streamId,
    set: {
      lastSeenAt: observedAt,
      isLive: true,
      sampleCount: sql`${streamerSessions.sampleCount} + 1`,
      dcsSampleCount: sql`${streamerSessions.dcsSampleCount} + ${isDcs ? 1 : 0}`,
      viewerSum: sql`${streamerSessions.viewerSum} + ${viewers}`,
      peakViewers: sql`GREATEST(${streamerSessions.peakViewers}, ${viewers})`,
      // Keep each distinct title once, in the order they were used.
      titles: sql`
        CASE WHEN ${streamerSessions.titles} @> ${JSON.stringify([stream.title ?? ''])}::jsonb
             THEN ${streamerSessions.titles}
             ELSE ${streamerSessions.titles} || ${JSON.stringify([stream.title ?? ''])}::jsonb
        END
      `,
    },
  })
}

/** Closes sessions that have gone unseen for more than two poll intervals. */
async function closeStaleSessions(): Promise<number> {
  const db = useDB()
  const cutoff = new Date(Date.now() - 2 * 5 * 60_000)

  const closed = await db.update(streamerSessions)
    .set({ isLive: false })
    .where(and(
      eq(streamerSessions.isLive, true),
      lt(streamerSessions.lastSeenAt, cutoff),
    ))
    .returning({ id: streamerSessions.id })

  return closed.length
}

/**
 * One sampling pass. Safe to call concurrently — overlapping runs are skipped
 * rather than queued, since a late sample is worth less than a consistent one.
 */
export async function collectSamples(): Promise<{ discovered: number; live: number; closed: number }> {
  if (collectInProgress) {
    console.log('[twitch-collect] passe déjà en cours, ignorée')
    return { discovered: 0, live: 0, closed: 0 }
  }

  collectInProgress = true
  const observedAt = new Date()

  try {
    const db = useDB()

    // 1. Whole category, every language.
    const categoryStreams = await fetchAllLiveDcsStreams()
    const discovered = await discoverFrenchStreamers(categoryStreams)

    // 2. Our French streamers, whatever they are playing.
    const tracked = await db.select().from(streamers).where(and(
      eq(streamers.isActive, true),
      eq(streamers.isFrench, true),
    ))

    const trackedStreams = tracked.length
      ? await fetchStreamsByUserIds(tracked.map(s => s.twitchId))
      : []

    // A streamer can appear in both lists; the stream id keeps it to one sample.
    const streamByUserId = new Map<string, TwitchStream>()
    for (const stream of [...categoryStreams, ...trackedStreams]) {
      streamByUserId.set(stream.user_id, stream)
    }

    const streamerByTwitchId = new Map(tracked.map(s => [s.twitchId, s]))
    const today = parisDay(observedAt)
    let live = 0

    for (const [twitchId, stream] of streamByUserId) {
      const streamer = streamerByTwitchId.get(twitchId)
      if (!streamer) continue // not French, or inactive

      await recordSample(streamer.id, stream, observedAt)
      live++

      const isDcs = stream.game_id === DCS_GAME_ID

      await db.update(streamers).set({
        isLive: true,
        currentViewers: stream.viewer_count ?? 0,
        lastStreamTitle: stream.title || null,
        lastStreamStartedAt: new Date(stream.started_at),
        updatedAt: observedAt,
      }).where(eq(streamers.id, streamer.id))

      // Kept for the existing activity heatmap.
      if (isDcs) {
        await db.insert(streamerDcsDays)
          .values({ streamerId: streamer.id, date: today })
          .onConflictDoNothing()
      }
    }

    // Mark everyone else offline.
    const liveStreamerIds = [...streamByUserId.keys()]
      .map(id => streamerByTwitchId.get(id)?.id)
      .filter((id): id is number => typeof id === 'number')

    const stillFlaggedLive = tracked.filter(s => s.isLive && !liveStreamerIds.includes(s.id))
    if (stillFlaggedLive.length) {
      await db.update(streamers)
        .set({ isLive: false, currentViewers: 0, updatedAt: observedAt })
        .where(inArray(streamers.id, stillFlaggedLive.map(s => s.id)))
    }

    const closed = await closeStaleSessions()

    console.log(JSON.stringify({
      event: 'twitch.collect',
      categoryStreams: categoryStreams.length,
      tracked: tracked.length,
      live,
      discovered,
      closed,
    }))

    return { discovered, live, closed }
  } finally {
    collectInProgress = false
  }
}
