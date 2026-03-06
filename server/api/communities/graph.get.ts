import { eq, sql } from 'drizzle-orm'
import { communities, communityModules, modules } from '#server/db/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  // Get all published communities
  const nodes = await db
    .select({
      id: communities.id,
      slug: communities.slug,
      name: communities.name,
      logoUrl: communities.logoUrl,
      communityType: communities.communityType,
      sizeCategory: communities.sizeCategory,
    })
    .from(communities)
    .where(eq(communities.published, true))

  // Shared modules between each pair of communities
  const links = await db.execute(sql`
    SELECT
      cm1.community_id as source,
      cm2.community_id as target,
      COUNT(*) as weight,
      array_agg(m.name) as shared_modules
    FROM community_modules cm1
    JOIN community_modules cm2
      ON cm1.module_id = cm2.module_id AND cm1.community_id < cm2.community_id
    JOIN modules m ON m.id = cm1.module_id
    JOIN communities c1 ON c1.id = cm1.community_id AND c1.published = true
    JOIN communities c2 ON c2.id = cm2.community_id AND c2.published = true
    GROUP BY cm1.community_id, cm2.community_id
    ORDER BY weight DESC
  `)

  // Module count per community
  const moduleCounts = await db.execute(sql`
    SELECT cm.community_id, COUNT(*) as count
    FROM community_modules cm
    JOIN communities c ON c.id = cm.community_id AND c.published = true
    GROUP BY cm.community_id
  `)

  const moduleCountMap: Record<number, number> = {}
  for (const row of moduleCounts as any[]) {
    moduleCountMap[row.community_id] = Number(row.count)
  }

  return {
    nodes: nodes.map(n => ({
      ...n,
      moduleCount: moduleCountMap[n.id] || 0,
    })),
    links: (links as any[]).map(l => ({
      source: l.source,
      target: l.target,
      weight: Number(l.weight),
      sharedModules: l.shared_modules,
    })),
  }
})
