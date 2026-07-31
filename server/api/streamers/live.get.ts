/**
 * GET /api/streamers/live — streamers currently live *on DCS*.
 *
 * We poll our streamers by user id so we can tell DCS time from total airtime,
 * which means `isLive` is true for any game. This is a DCS directory, so the
 * live list must match on the game too — otherwise a sim-racing stream shows up
 * as a live DCS stream.
 */
import { and, desc, eq } from 'drizzle-orm'
import { streamers } from '#server/db/schema'
import { DCS_GAME_ID } from '#server/utils/twitch'

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
    .where(and(
      eq(streamers.isLive, true),
      eq(streamers.currentGameId, DCS_GAME_ID),
    ))
    .orderBy(desc(streamers.currentViewers))

  return {
    count: live.length,
    data: live.map(s => ({
      ...s,
      lastStreamStartedAt: s.lastStreamStartedAt?.toISOString() ?? null,
    })),
  }
})
