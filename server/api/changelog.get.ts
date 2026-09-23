import { desc, eq } from 'drizzle-orm'
import { communities } from '#server/db/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const rows = await db
    .select({
      id: communities.id,
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

  return rows.map(({ id, ...r }) => ({
    ...r,
    logoUrl: mediaUrl('logo', id, r.logoUrl),
    createdAt: r.createdAt?.toISOString(),
    updatedAt: r.updatedAt?.toISOString(),
  }))
})
