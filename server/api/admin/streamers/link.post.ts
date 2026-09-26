import { and, eq } from 'drizzle-orm'
import { communityStreamers } from '#server/db/schema'

/**
 * POST /api/admin/streamers/link { communityId, streamerId, action }
 * action: 'link' | 'unlink' | 'dismiss'.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const communityId = Number(body?.communityId)
  const streamerId = Number(body?.streamerId)
  const action = body?.action

  if (!Number.isInteger(communityId) || !Number.isInteger(streamerId) || !['link', 'unlink', 'dismiss'].includes(action)) {
    throw createError({ statusCode: 400, statusMessage: 'Requête invalide' })
  }

  const db = useDB()
  if (action === 'dismiss') {
    await dismissStreamer(communityId, streamerId, 'admin', null)
  } else if (action === 'unlink') {
    await db.delete(communityStreamers).where(and(
      eq(communityStreamers.communityId, communityId),
      eq(communityStreamers.streamerId, streamerId),
    ))
  } else {
    await db.insert(communityStreamers)
      .values({ communityId, streamerId, status: 'linked', source: 'admin' })
      .onConflictDoUpdate({
        target: [communityStreamers.communityId, communityStreamers.streamerId],
        set: { status: 'linked', source: 'admin' },
      })
  }

  console.log(JSON.stringify({ event: 'streamer.link', action, communityId, streamerId }))
  return { ok: true }
})
