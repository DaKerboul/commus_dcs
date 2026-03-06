import { sql } from 'drizzle-orm'
import { modules } from '#server/db/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const result = await db.execute(sql`
    SELECT
      m.id,
      m.name,
      m.category,
      COALESCE(used.count, 0) as community_count,
      COALESCE(sought.count, 0) as sought_count,
      COALESCE(used.community_names, ARRAY[]::text[]) as community_names,
      COALESCE(sought.community_names, ARRAY[]::text[]) as sought_community_names
    FROM modules m
    LEFT JOIN (
      SELECT cm.module_id,
             COUNT(DISTINCT cm.community_id) as count,
             array_agg(DISTINCT c.name) as community_names
      FROM community_modules cm
      JOIN communities c ON c.id = cm.community_id AND c.published = true
      GROUP BY cm.module_id
    ) used ON used.module_id = m.id
    LEFT JOIN (
      SELECT csm.module_id,
             COUNT(DISTINCT csm.community_id) as count,
             array_agg(DISTINCT c.name) as community_names
      FROM community_sought_modules csm
      JOIN communities c ON c.id = csm.community_id AND c.published = true
      GROUP BY csm.module_id
    ) sought ON sought.module_id = m.id
    ORDER BY COALESCE(used.count, 0) DESC, m.name ASC
  `)

  return (result as any[]).map(row => ({
    id: row.id,
    name: row.name,
    category: row.category || 'other',
    communityCount: Number(row.community_count),
    soughtCount: Number(row.sought_count),
    communities: row.community_names || [],
    soughtCommunities: row.sought_community_names || [],
  }))
})
