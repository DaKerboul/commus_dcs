/**
 * Twitch Sync Logic — Discovers streamers, polls live status, backfills VODs.
 * Streamers are discovered via DCS live polling (game_id filter), so all their
 * VODs are imported without additional title filtering.
 */
import { eq, and, isNull, sql, desc } from 'drizzle-orm'
import { streamers, streamSessions, communities } from '#server/db/schema'
import {
  fetchLiveDcsStreams,
  fetchTwitchUsers,
  fetchTwitchUsersByIds,
  fetchUserVods,
} from './twitch'

// ── Duration Parser ────────────────────────────────────

export function parseTwitchDuration(duration: string): number {
  let seconds = 0
  const hours = duration.match(/(\d+)h/)
  const minutes = duration.match(/(\d+)m/)
  const secs = duration.match(/(\d+)s/)
  if (hours?.[1]) seconds += parseInt(hours[1]) * 3600
  if (minutes?.[1]) seconds += parseInt(minutes[1]) * 60
  if (secs?.[1]) seconds += parseInt(secs[1])
  return seconds
}

// ── Sync Lock ──────────────────────────────────────────

let syncInProgress = false

// ── Discovery + Live Poll ──────────────────────────────

/**
 * Discover new DCS FR streamers and update live status of all known ones.
 */
export async function discoverAndSyncStreamers(): Promise<{ discovered: number; liveCount: number }> {
  const db = useDB()

  // 1. Fetch currently live DCS FR streams
  const liveStreams = await fetchLiveDcsStreams()
  console.log(`[twitch-sync] 📡 ${liveStreams.length} live DCS FR stream(s) found`)

  // 2. Get existing streamers
  const existingStreamers = await db.select().from(streamers)
  const existingLogins = new Set(existingStreamers.map(s => s.twitchLogin))

  // 3. Discover new streamers
  const newLogins = liveStreams
    .filter(s => !existingLogins.has(s.user_login))
    .map(s => s.user_login)

  let discovered = 0
  if (newLogins.length > 0) {
    const users = await fetchTwitchUsers(newLogins)
    for (const user of users) {
      try {
        await db.insert(streamers).values({
          twitchId: user.id,
          twitchLogin: user.login,
          displayName: user.display_name,
          description: user.description || null,
          profileImageUrl: user.profile_image_url || null,
        }).onConflictDoNothing()
        discovered++
      } catch (e) {
        console.warn(`[twitch-sync] Could not insert streamer ${user.login}:`, e)
      }
    }
    if (discovered > 0) {
      console.log(`[twitch-sync] ✨ Discovered ${discovered} new streamer(s): ${newLogins.join(', ')}`)
    }
  }

  // 4. Update live status for ALL known streamers
  const allStreamers = await db.select().from(streamers).where(eq(streamers.isActive, true))
  const liveLoginMap = new Map(liveStreams.map(s => [s.user_login, s]))

  for (const streamer of allStreamers) {
    const liveStream = liveLoginMap.get(streamer.twitchLogin)

    if (liveStream) {
      // Streamer is LIVE on DCS
      await db.update(streamers)
        .set({
          isLive: true,
          currentViewers: liveStream.viewer_count,
          lastStreamTitle: liveStream.title,
          lastStreamStartedAt: new Date(liveStream.started_at),
          updatedAt: new Date(),
        })
        .where(eq(streamers.id, streamer.id))

      // Create or update live session
      const streamStart = new Date(liveStream.started_at)
      const existingSession = await db.select()
        .from(streamSessions)
        .where(
          and(
            eq(streamSessions.streamerId, streamer.id),
            isNull(streamSessions.endedAt),
          ),
        )
        .limit(1)

      if (existingSession.length === 0) {
        await db.insert(streamSessions).values({
          streamerId: streamer.id,
          title: liveStream.title,
          startedAt: streamStart,
          maxViewers: liveStream.viewer_count,
        })
      } else {
        // Update max viewers
        const session = existingSession[0]!
        const updates: any = {}
        if (liveStream.viewer_count > (session.maxViewers || 0)) {
          updates.maxViewers = liveStream.viewer_count
        }
        if (liveStream.title !== session.title) {
          updates.title = liveStream.title
        }
        if (Object.keys(updates).length > 0) {
          await db.update(streamSessions)
            .set(updates)
            .where(eq(streamSessions.id, session.id))
        }
      }
    } else if (streamer.isLive) {
      // Was live, now offline — close open sessions
      await db.update(streamers)
        .set({ isLive: false, currentViewers: 0, updatedAt: new Date() })
        .where(eq(streamers.id, streamer.id))

      const openSessions = await db.select()
        .from(streamSessions)
        .where(
          and(
            eq(streamSessions.streamerId, streamer.id),
            isNull(streamSessions.endedAt),
          ),
        )

      for (const session of openSessions) {
        const now = new Date()
        const duration = Math.round((now.getTime() - session.startedAt.getTime()) / 1000)
        await db.update(streamSessions)
          .set({ endedAt: now, durationSeconds: duration })
          .where(eq(streamSessions.id, session.id))
      }
    }
  }

  // 5. Close orphan sessions (open for 24h+ — server restarts, missed transitions)
  await db.execute(sql`
    UPDATE stream_sessions
    SET ended_at = started_at + interval '1 second' * COALESCE(duration_seconds, 14400),
        duration_seconds = COALESCE(duration_seconds, 14400)
    WHERE ended_at IS NULL
      AND started_at < NOW() - interval '24 hours'
  `)

  return { discovered, liveCount: liveStreams.length }
}

// ── VOD Backfill ───────────────────────────────────────

/**
 * Backfill VODs for a single streamer (discovered via DCS live polling).
 */
export async function backfillStreamerVods(streamerId: number): Promise<number> {
  const db = useDB()

  const [streamer] = await db.select().from(streamers).where(eq(streamers.id, streamerId)).limit(1)
  if (!streamer) return 0

  const vods = await fetchUserVods(streamer.twitchId)
  let imported = 0

  for (const vod of vods) {
    // Skip already imported (by video ID)
    const existingByVod = await db.select({ id: streamSessions.id })
      .from(streamSessions)
      .where(eq(streamSessions.twitchVideoId, vod.id))
      .limit(1)
    if (existingByVod.length > 0) continue

    const duration = parseTwitchDuration(vod.duration)
    const startedAt = new Date(vod.created_at)
    const endedAt = new Date(startedAt.getTime() + duration * 1000)
    const thumbUrl = vod.thumbnail_url
      ?.replace('%{width}', '320')
      .replace('%{height}', '180') || null

    // Check if we already have a session at this time (from live polling) — 5 min tolerance
    const existingByTime = await db.select({ id: streamSessions.id })
      .from(streamSessions)
      .where(
        and(
          eq(streamSessions.streamerId, streamerId),
          sql`ABS(EXTRACT(EPOCH FROM (${streamSessions.startedAt} - ${startedAt}::timestamp))) < 300`,
        ),
      )
      .limit(1)

    if (existingByTime.length > 0) {
      // Merge VOD data into existing session
      await db.update(streamSessions)
        .set({
          twitchVideoId: vod.id,
          endedAt,
          durationSeconds: duration,
          thumbnailUrl: thumbUrl,
        })
        .where(eq(streamSessions.id, existingByTime[0]!.id))
    } else {
      await db.insert(streamSessions).values({
        streamerId,
        twitchVideoId: vod.id,
        title: vod.title,
        startedAt,
        endedAt,
        durationSeconds: duration,
        avgViewers: vod.view_count,
        thumbnailUrl: thumbUrl,
      })
      imported++
    }
  }

  if (imported > 0) {
    console.log(`[twitch-sync] 📼 Backfilled ${imported} DCS VOD(s) for ${streamer.twitchLogin}`)
  }
  return imported
}

/**
 * Backfill VODs for all active streamers.
 */
export async function backfillAllVods(): Promise<number> {
  const db = useDB()
  const allStreamers = await db.select().from(streamers).where(eq(streamers.isActive, true))
  let total = 0

  for (const streamer of allStreamers) {
    try {
      total += await backfillStreamerVods(streamer.id)
      // Rate limit: 1 second between streamers
      await new Promise(r => setTimeout(r, 1000))
    } catch (e) {
      console.error(`[twitch-sync] Error backfilling VODs for ${streamer.twitchLogin}:`, e)
    }
  }

  return total
}

// ── Add Streamers by Login ─────────────────────────────

/**
 * Add specific streamers by their Twitch login names (for manual/seed additions).
 */
export async function addStreamersByLogin(logins: string[]): Promise<number> {
  const db = useDB()

  // Filter out already known
  const existing = await db.select({ login: streamers.twitchLogin }).from(streamers)
  const existingSet = new Set(existing.map(s => s.login.toLowerCase()))
  const newLogins = logins.filter(l => !existingSet.has(l.toLowerCase()))

  if (newLogins.length === 0) return 0

  const users = await fetchTwitchUsers(newLogins)
  let added = 0

  for (const user of users) {
    try {
      await db.insert(streamers).values({
        twitchId: user.id,
        twitchLogin: user.login,
        displayName: user.display_name,
        description: user.description || null,
        profileImageUrl: user.profile_image_url || null,
      }).onConflictDoNothing()
      added++
    } catch (e) {
      console.warn(`[twitch-sync] Could not add ${user.login}:`, e)
    }
  }

  console.log(`[twitch-sync] ✅ Added ${added} streamer(s) manually`)
  return added
}

// ── Full Sync ──────────────────────────────────────────

/**
 * Complete sync: discover streamers + update live status + backfill VODs.
 */
export async function fullSync(): Promise<{ discovered: number; liveCount: number; vodsImported: number }> {
  if (syncInProgress) {
    console.log('[twitch-sync] ⏳ Sync already in progress, skipping')
    return { discovered: 0, liveCount: 0, vodsImported: 0 }
  }

  syncInProgress = true
  try {
    console.log('[twitch-sync] 🔄 Starting full sync...')
    const { discovered, liveCount } = await discoverAndSyncStreamers()
    const vodsImported = await backfillAllVods()
    console.log(`[twitch-sync] ✅ Full sync complete — ${discovered} new, ${liveCount} live, ${vodsImported} VODs imported`)
    return { discovered, liveCount, vodsImported }
  } finally {
    syncInProgress = false
  }
}

/**
 * Refresh Twitch profiles (display name, avatar, description) for all streamers.
 */
export async function refreshStreamerProfiles(): Promise<void> {
  const db = useDB()
  const allStreamers = await db.select().from(streamers).where(eq(streamers.isActive, true))

  if (allStreamers.length === 0) return

  const ids = allStreamers.map(s => s.twitchId)
  const users = await fetchTwitchUsersByIds(ids)
  const userMap = new Map(users.map(u => [u.id, u]))

  for (const streamer of allStreamers) {
    const user = userMap.get(streamer.twitchId)
    if (!user) continue

    await db.update(streamers)
      .set({
        displayName: user.display_name,
        description: user.description || null,
        profileImageUrl: user.profile_image_url || null,
        updatedAt: new Date(),
      })
      .where(eq(streamers.id, streamer.id))
  }

  console.log(`[twitch-sync] 👤 Refreshed ${users.length} streamer profile(s)`)
}
