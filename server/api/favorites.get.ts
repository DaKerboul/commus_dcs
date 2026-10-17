import { desc, eq, and } from 'drizzle-orm'
import { communities, userFavorites } from '#server/db/schema'

/** The signed-in visitor's favorites, newest first. Unpublished communities are left out. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = useDB()

  const rows = await db
    .select({ slug: communities.slug })
    .from(userFavorites)
    .innerJoin(communities, eq(communities.id, userFavorites.communityId))
    .where(and(eq(userFavorites.userId, user.id), eq(communities.published, true)))
    .orderBy(desc(userFavorites.createdAt), desc(userFavorites.id))

  return { slugs: rows.map(r => r.slug) }
})
