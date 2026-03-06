/**
 * GET /api/admin/streamers/debug-vods — Debug VOD fetch for first active streamer.
 * TEMPORARY: remove after fixing the backfill.
 */
import { eq } from 'drizzle-orm'
import { streamers } from '#server/db/schema'
import { fetchUserVods } from '#server/utils/twitch'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const db = useDB()
  const allStreamers = await db.select().from(streamers).where(eq(streamers.isActive, true))

  const debug: any[] = []

  for (const streamer of allStreamers) {
    try {
      const vods = await fetchUserVods(streamer.twitchId)
      debug.push({
        login: streamer.twitchLogin,
        twitchId: streamer.twitchId,
        dbId: streamer.id,
        isActive: streamer.isActive,
        vodsFromApi: vods.length,
        firstVod: vods[0] ? { id: vods[0].id, title: vods[0].title, duration: vods[0].duration } : null,
      })
    } catch (e: any) {
      debug.push({
        login: streamer.twitchLogin,
        twitchId: streamer.twitchId,
        error: e?.message || String(e),
      })
    }
  }

  return {
    streamersCount: allStreamers.length,
    debug,
    _v: 3,
  }
})
