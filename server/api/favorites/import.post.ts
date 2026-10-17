import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { communities, userFavorites } from '#server/db/schema'
import { MAX_FAVORITES, normalizeFavoriteSlugs } from '#server/utils/favorites'

/**
 * One-time merge of the list a visitor kept in their browser before signing in.
 * Unknown or unpublished slugs are ignored; the 100-favorite cap still applies.
 * Returns the full list afterwards, newest first.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  enforceRateLimit(`favorites-import:${user.id}`, { max: 10, windowMs: 60_000 }, 'Trop de tentatives, réessayez dans un instant.')

  const body = await readBody(event)
  const wanted = normalizeFavoriteSlugs(body?.slugs)
  const db = useDB()

  if (wanted.length) {
    const [{ total }] = await db.select({ total: count() }).from(userFavorites).where(eq(userFavorites.userId, user.id))
    const room = MAX_FAVORITES - Number(total)

    if (room > 0) {
      const found = await db
        .select({ id: communities.id })
        .from(communities)
        .where(and(inArray(communities.slug, wanted), eq(communities.published, true)))
      const values = found.slice(0, room).map(c => ({ userId: user.id, communityId: c.id }))
      if (values.length) await db.insert(userFavorites).values(values).onConflictDoNothing()
    }
  }

  const rows = await db
    .select({ slug: communities.slug })
    .from(userFavorites)
    .innerJoin(communities, eq(communities.id, userFavorites.communityId))
    .where(and(eq(userFavorites.userId, user.id), eq(communities.published, true)))
    .orderBy(desc(userFavorites.createdAt), desc(userFavorites.id))

  return { slugs: rows.map(r => r.slug) }
})
