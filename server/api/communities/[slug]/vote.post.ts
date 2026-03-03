import { eq, sql } from 'drizzle-orm'
import { communities } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug requis' })
  }

  // Check community exists
  const [community] = await db
    .select({ id: communities.id, votes: communities.votes })
    .from(communities)
    .where(eq(communities.slug, slug))
    .limit(1)

  if (!community) {
    throw createError({ statusCode: 404, statusMessage: 'Communauté introuvable' })
  }

  // Increment vote count
  await db
    .update(communities)
    .set({ votes: sql`COALESCE(${communities.votes}, 0) + 1` })
    .where(eq(communities.slug, slug))

  return { votes: (community.votes || 0) + 1 }
})
