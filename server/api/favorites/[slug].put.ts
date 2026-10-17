import { and, count, eq } from 'drizzle-orm'
import { communities, userFavorites } from '#server/db/schema'
import { MAX_FAVORITES } from '#server/utils/favorites'

/** Adds a community to the favorites. Idempotent: adding it twice changes nothing. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug requis' })

  enforceRateLimit(`favorites:${user.id}`, { max: 60, windowMs: 60_000 }, 'Trop de modifications de favoris, réessayez dans un instant.')

  const db = useDB()
  const [community] = await db
    .select({ id: communities.id })
    .from(communities)
    .where(and(eq(communities.slug, slug), eq(communities.published, true)))
    .limit(1)
  if (!community) throw createError({ statusCode: 404, statusMessage: 'Communauté introuvable' })

  const [existing] = await db
    .select({ id: userFavorites.id })
    .from(userFavorites)
    .where(and(eq(userFavorites.userId, user.id), eq(userFavorites.communityId, community.id)))
    .limit(1)
  if (existing) return { ok: true }

  const [{ total }] = await db.select({ total: count() }).from(userFavorites).where(eq(userFavorites.userId, user.id))
  if (Number(total) >= MAX_FAVORITES) {
    throw createError({ statusCode: 409, statusMessage: `Limite de ${MAX_FAVORITES} favoris atteinte` })
  }

  await db.insert(userFavorites).values({ userId: user.id, communityId: community.id }).onConflictDoNothing()
  return { ok: true }
})
