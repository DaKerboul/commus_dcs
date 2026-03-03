import { eq, sql, ne, and } from 'drizzle-orm'
import { communities, communityModules, modules } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)
  const slug = query.slug as string

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  }

  // Get the community
  const [community] = await db
    .select({ id: communities.id })
    .from(communities)
    .where(eq(communities.slug, slug))
    .limit(1)

  if (!community) {
    return { data: [] }
  }

  // Find communities sharing the most modules
  const similar = await db.execute(sql`
    SELECT c.id, c.slug, c.name, c.short_description, c.logo_url,
           c.size_category, c.community_type, c.recruitment_status,
           c.event_frequency, c.discord_url, c.website_url,
           COUNT(DISTINCT shared.module_id) as shared_modules
    FROM communities c
    JOIN community_modules cm ON cm.community_id = c.id
    JOIN community_modules shared ON shared.module_id = cm.module_id
      AND shared.community_id = ${community.id}
    WHERE c.id != ${community.id}
      AND c.published = true
    GROUP BY c.id
    ORDER BY shared_modules DESC
    LIMIT 3
  `)

  const data = (similar as any[]).map((row: any) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    logoUrl: row.logo_url,
    sizeCategory: row.size_category,
    communityType: row.community_type,
    recruitmentStatus: row.recruitment_status,
    eventFrequency: row.event_frequency,
    discordUrl: row.discord_url,
    websiteUrl: row.website_url,
    moduleNames: [],
    experienceNames: [],
    historicalPeriods: [],
  }))

  return { data }
})
