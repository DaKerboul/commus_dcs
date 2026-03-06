import { eq, sql, count } from 'drizzle-orm'
import {
  communities,
  communityModules,
  modules,
  communityExperiences,
  experiences,
  communityHistoricalPeriods,
} from '#server/db/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const [
    [{ totalCommunities }],
    [{ totalModules }],
    modulesByCategory,
    moduleUsage,
    experienceDistribution,
    typeDistribution,
    sizeDistribution,
    periodDistribution,
    moduleToCommunities,
  ] = await Promise.all([
    db.select({ totalCommunities: count() })
      .from(communities).where(eq(communities.published, true)),

    db.select({ totalModules: count() }).from(modules),

    db.select({ category: modules.category, count: count() })
      .from(modules).groupBy(modules.category),

    db.execute(sql`
      SELECT m.name, m.category, COUNT(DISTINCT cm.community_id) as count
      FROM modules m
      LEFT JOIN community_modules cm ON cm.module_id = m.id
      LEFT JOIN communities c ON c.id = cm.community_id AND c.published = true
      GROUP BY m.id, m.name, m.category
      HAVING COUNT(DISTINCT cm.community_id) > 0
      ORDER BY count DESC
    `),

    db.select({ name: experiences.name, count: count() })
      .from(communityExperiences)
      .innerJoin(experiences, eq(communityExperiences.experienceId, experiences.id))
      .groupBy(experiences.name)
      .orderBy(sql`count(*) DESC`),

    db.select({ type: communities.communityType, count: count() })
      .from(communities)
      .where(eq(communities.published, true))
      .groupBy(communities.communityType),

    db.select({ size: communities.sizeCategory, count: count() })
      .from(communities)
      .where(eq(communities.published, true))
      .groupBy(communities.sizeCategory),

    db.execute(sql`
      SELECT chp.period, COUNT(DISTINCT chp.community_id) as count
      FROM community_historical_periods chp
      JOIN communities c ON c.id = chp.community_id AND c.published = true
      GROUP BY chp.period
      ORDER BY count DESC
    `),

    db.execute(sql`
      SELECT m.name as module_name, m.category, c.name as community_name
      FROM community_modules cm
      JOIN modules m ON m.id = cm.module_id
      JOIN communities c ON c.id = cm.community_id AND c.published = true
      ORDER BY m.category, m.name
    `),
  ])

  return {
    totalCommunities: Number(totalCommunities),
    totalModules: Number(totalModules),
    modulesByCategory: modulesByCategory.map(r => ({
      category: r.category || 'other',
      count: Number(r.count),
    })),
    moduleUsage: (moduleUsage as any[]).map(r => ({
      name: r.name,
      category: r.category || 'other',
      count: Number(r.count),
    })),
    experienceDistribution: experienceDistribution.map(r => ({
      name: r.name,
      count: Number(r.count),
    })),
    typeDistribution: typeDistribution.map(r => ({
      type: r.type,
      count: Number(r.count),
    })),
    sizeDistribution: sizeDistribution.map(r => ({
      size: r.size,
      count: Number(r.count),
    })),
    periodDistribution: (periodDistribution as any[]).map(r => ({
      period: r.period,
      count: Number(r.count),
    })),
    moduleToCommunities: (moduleToCommunities as any[]).map(r => ({
      module: r.module_name,
      category: r.category || 'other',
      community: r.community_name,
    })),
  }
})
