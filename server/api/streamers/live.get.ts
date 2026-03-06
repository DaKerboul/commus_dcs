/**
 * GET /api/streamers/live — Quick endpoint for currently live DCS FR streamers.
 */
import { eq } from 'drizzle-orm'
import { streamers } from '#server/db/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const live = await db
    .select({
      twitchLogin: streamers.twitchLogin,
      displayName: streamers.displayName,
      profileImageUrl: streamers.profileImageUrl,
      currentViewers: streamers.currentViewers,
      lastStreamTitle: streamers.lastStreamTitle,
      lastStreamStartedAt: streamers.lastStreamStartedAt,
    })
    .from(streamers)
    .where(eq(streamers.isLive, true))
    .orderBy(streamers.currentViewers)

  return {
    count: live.length,
    data: live.map(s => ({
      ...s,
      lastStreamStartedAt: s.lastStreamStartedAt?.toISOString() ?? null,
    })),
  }
})
