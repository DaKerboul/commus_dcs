import { and, eq, inArray } from 'drizzle-orm'
import { communities, userFavorites } from '#server/db/schema'

/** Removes a community from the favorites. Idempotent: removing an absent one is fine. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug requis' })

  enforceRateLimit(`favorites:${user.id}`, { max: 60, windowMs: 60_000 }, 'Trop de modifications de favoris, réessayez dans un instant.')

  const db = useDB()
  await db.delete(userFavorites).where(and(
    eq(userFavorites.userId, user.id),
    inArray(userFavorites.communityId, db.select({ id: communities.id }).from(communities).where(eq(communities.slug, slug))),
  ))
  return { ok: true }
})
