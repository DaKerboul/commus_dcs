import { sql } from 'drizzle-orm'
import { communities } from '#server/db/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const [random] = await db
    .select({ slug: communities.slug })
    .from(communities)
    .where(sql`${communities.published} = true`)
    .orderBy(sql`RANDOM()`)
    .limit(1)

  if (!random) {
    throw createError({ statusCode: 404, statusMessage: 'Aucune communauté trouvée' })
  }

  return { slug: random.slug }
})
