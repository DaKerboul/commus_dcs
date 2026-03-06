/**
 * Twitch Sync Logic — Discovers DCS FR streamers via live polling and tracks DCS activity days.
 * Streamers are discovered via game_id filter (DCS World = 313331).
 * When detected live, we record today's date as a DCS day for that streamer.
 */
import { eq, and, sql } from 'drizzle-orm'
import { streamers, streamerDcsDays, communities } from '#server/db/schema'
import {
  fetchLiveDcsStreams,
  fetchTwitchUsers,
  fetchTwitchUsersByIds,
} from './twitch'

// ── Sync Lock ──────────────────────────────────────────

let syncInProgress = false

// ── Paris-timezone date helper ─────────────────────────

function getParisDateStr(): string {
  return new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }) // YYYY-MM-DD
}

// ── Discovery + Live Poll ──────────────────────────────

/**
 * Discover new DCS FR streamers and update live status of all known ones.
 * When a streamer is live on DCS, record today as a DCS activity day.
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
  const todayStr = getParisDateStr()

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

      // Record DCS activity day (upsert: ignore if already exists)
      await db.insert(streamerDcsDays).values({
        streamerId: streamer.id,
        date: todayStr,
      }).onConflictDoNothing()
    } else if (streamer.isLive) {
      // Was live, now offline
      await db.update(streamers)
        .set({ isLive: false, currentViewers: 0, updatedAt: new Date() })
        .where(eq(streamers.id, streamer.id))
    }
  }

  return { discovered, liveCount: liveStreams.length }
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
 * Complete sync: discover streamers + update live status + record DCS days.
 */
export async function fullSync(): Promise<{ discovered: number; liveCount: number }> {
  if (syncInProgress) {
    console.log('[twitch-sync] ⏳ Sync already in progress, skipping')
    return { discovered: 0, liveCount: 0 }
  }

  syncInProgress = true
  try {
    console.log('[twitch-sync] 🔄 Starting full sync...')
    const result = await discoverAndSyncStreamers()
    console.log(`[twitch-sync] ✅ Full sync complete — ${result.discovered} new, ${result.liveCount} live`)
    return result
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
