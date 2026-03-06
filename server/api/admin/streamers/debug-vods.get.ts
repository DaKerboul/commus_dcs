/**
 * GET /api/admin/streamers/debug-vods — Debug VOD fetch + insertion for first active streamer.
 * TEMPORARY: remove after fixing the backfill.
 */
import { eq } from 'drizzle-orm'
import { streamers, streamSessions } from '#server/db/schema'
import { fetchUserVods } from '#server/utils/twitch'
import { parseTwitchDuration } from '#server/utils/twitch-sync'

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
      const entry: any = {
        login: streamer.twitchLogin,
        twitchId: streamer.twitchId,
        dbId: streamer.id,
        vodsFromApi: vods.length,
      }

      // Try inserting the first VOD
      if (vods.length > 0) {
        const vod = vods[0]!
        try {
          const duration = parseTwitchDuration(vod.duration)
          const startedAt = new Date(vod.created_at)
          const endedAt = new Date(startedAt.getTime() + duration * 1000)
          const thumbUrl = vod.thumbnail_url
            ?.replace('%{width}', '320')
            .replace('%{height}', '180') || null

          // Check existing
          const existing = await db.select({ id: streamSessions.id })
            .from(streamSessions)
            .where(eq(streamSessions.twitchVideoId, vod.id))
            .limit(1)

          if (existing.length > 0) {
            entry.insertResult = 'already_exists'
            entry.existingId = existing[0]!.id
          } else {
            const result = await db.insert(streamSessions).values({
              streamerId: streamer.id,
              twitchVideoId: vod.id,
              title: vod.title,
              startedAt,
              endedAt,
              durationSeconds: duration,
              avgViewers: vod.view_count,
              thumbnailUrl: thumbUrl,
            }).returning({ id: streamSessions.id })
            entry.insertResult = 'inserted'
            entry.insertedId = result[0]?.id
            entry.vodTitle = vod.title
            entry.duration = duration
          }
        } catch (insertErr: any) {
          entry.insertResult = 'error'
          entry.insertError = insertErr?.message || String(insertErr)
        }
      }

      debug.push(entry)
    } catch (e: any) {
      debug.push({
        login: streamer.twitchLogin,
        error: e?.message || String(e),
      })
    }
  }

  return {
    streamersCount: allStreamers.length,
    debug,
    _v: 4,
  }
})
