import { desc, eq } from 'drizzle-orm'
import { communities } from '#server/db/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const rows = await db
    .select({
      slug: communities.slug,
      name: communities.name,
      shortDescription: communities.shortDescription,
      logoUrl: communities.logoUrl,
      createdAt: communities.createdAt,
      updatedAt: communities.updatedAt,
    })
    .from(communities)
    .where(eq(communities.published, true))
    .orderBy(desc(communities.updatedAt))
    .limit(30)

  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt?.toISOString(),
    updatedAt: r.updatedAt?.toISOString(),
  }))
})
