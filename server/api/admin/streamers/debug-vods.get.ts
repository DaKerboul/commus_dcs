/**
 * GET /api/admin/streamers/debug-vods — Debug: direct VOD backfill bypassing fullSync.
 * TEMPORARY: remove after fixing the backfill.
 */
import { eq } from 'drizzle-orm'
import { streamers, streamSessions } from '#server/db/schema'
import { fetchUserVods } from '#server/utils/twitch'
import { parseTwitchDuration, backfillStreamerVods, backfillAllVods } from '#server/utils/twitch-sync'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const mode = query.mode || 'info'

  const db = useDB()
  const allStreamers = await db.select().from(streamers).where(eq(streamers.isActive, true))

  // Mode: info — just show stats
  if (mode === 'info') {
    const debug: any[] = []
    for (const streamer of allStreamers) {
      try {
        const vods = await fetchUserVods(streamer.twitchId)
        const sessions = await db.select({ id: streamSessions.id })
          .from(streamSessions)
          .where(eq(streamSessions.streamerId, streamer.id))
        debug.push({
          login: streamer.twitchLogin,
          twitchId: streamer.twitchId,
          dbId: streamer.id,
          vodsFromApi: vods.length,
          sessionsInDb: sessions.length,
        })
      } catch (e: any) {
        debug.push({ login: streamer.twitchLogin, error: e?.message })
      }
    }
    return { mode: 'info', streamersCount: allStreamers.length, debug, _v: 5 }
  }

  // Mode: backfill — run backfillAllVods directly (bypass fullSync lock)
  if (mode === 'backfill') {
    try {
      const total = await backfillAllVods()
      const sessionsAfter = await db.select({ id: streamSessions.id }).from(streamSessions)
      return { mode: 'backfill', vodsImported: total, totalSessionsInDb: sessionsAfter.length, _v: 5 }
    } catch (e: any) {
      return { mode: 'backfill', error: e?.message || String(e), stack: e?.stack?.split('\n').slice(0, 5), _v: 5 }
    }
  }

  // Mode: single — backfill just the first streamer directly
  if (mode === 'single' && allStreamers.length > 0) {
    const s = allStreamers[0]!
    try {
      const count = await backfillStreamerVods(s.id)
      const sessionsAfter = await db.select({ id: streamSessions.id })
        .from(streamSessions)
        .where(eq(streamSessions.streamerId, s.id))
      return { mode: 'single', streamer: s.twitchLogin, vodsImported: count, sessionsInDb: sessionsAfter.length, _v: 5 }
    } catch (e: any) {
      return { mode: 'single', streamer: s.twitchLogin, error: e?.message || String(e), stack: e?.stack?.split('\n').slice(0, 5), _v: 5 }
    }
  }

  return { error: 'Unknown mode. Use ?mode=info|backfill|single', _v: 5 }
})
