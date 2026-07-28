import { eq } from 'drizzle-orm'
import { communities } from '#server/db/schema'

const TRACK_LIMIT = { max: 60, windowMs: 60 * 1000, blockMs: 60 * 1000 }

/**
 * POST /api/communities/:slug/track { type }
 *
 * Increments an aggregate counter. Nothing about the visitor is stored — the IP
 * is used only as a rate-limit key and never written to the database.
 * Always returns 204 so a blocked or invalid call never surfaces to the user.
 */
export default defineEventHandler(async (event) => {
  setResponseStatus(event, 204)

  try {
    const slug = getRouterParam(event, 'slug')
    if (!slug) return null

    const body = await readBody(event).catch(() => null)
    if (!isTrackableEvent(body?.type)) return null

    const limit = consumeRateLimit(rateLimitKeyFromIp(event, 'track'), TRACK_LIMIT)
    if (!limit.ok) return null

    const db = useDB()
    const [community] = await db.select({ id: communities.id })
      .from(communities).where(eq(communities.slug, slug)).limit(1)

    if (community) {
      await recordCommunityEvent(community.id, body.type)
    }
  } catch {
    // Analytics must never surface an error to the visitor.
  }

  return null
})
