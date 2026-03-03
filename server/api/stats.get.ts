import { count, eq, sql } from 'drizzle-orm'
import {
  communities,
  communityModules,
  communityExperiences,
  modules,
  experiences,
} from '#server/db/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const [
    [{ totalCommunities }],
    [{ totalModules }],
    [{ openRecruitment }],
    communityByTypeRows,
    communityBySizeRows,
    topModulesRows,
    topExperiencesRows,
  ] = await Promise.all([
    db.select({ totalCommunities: count() }).from(communities).where(eq(communities.published, true)),
    db.select({ totalModules: count() }).from(modules),
    db.select({ openRecruitment: count() }).from(communities)
      .where(sql`${communities.published} = true AND ${communities.recruitmentStatus} = 'open'`),
    db.select({
      type: communities.communityType,
      count: count(),
    }).from(communities).where(eq(communities.published, true)).groupBy(communities.communityType),
    db.select({
      size: communities.sizeCategory,
      count: count(),
    }).from(communities).where(eq(communities.published, true)).groupBy(communities.sizeCategory),
    db.select({
      name: modules.name,
      count: count(),
    }).from(communityModules)
      .innerJoin(modules, eq(communityModules.moduleId, modules.id))
      .groupBy(modules.name)
      .orderBy(sql`count(*) DESC`)
      .limit(15),
    db.select({
      name: experiences.name,
      count: count(),
    }).from(communityExperiences)
      .innerJoin(experiences, eq(communityExperiences.experienceId, experiences.id))
      .groupBy(experiences.name)
      .orderBy(sql`count(*) DESC`)
      .limit(10),
  ])

  return {
    totalCommunities: Number(totalCommunities),
    totalModules: Number(totalModules),
    openRecruitment: Number(openRecruitment),
    communityByType: communityByTypeRows.map(r => ({ type: r.type, count: Number(r.count) })),
    communityBySize: communityBySizeRows.map(r => ({ size: r.size, count: Number(r.count) })),
    topModules: topModulesRows.map(r => ({ name: r.name, count: Number(r.count) })),
    topExperiences: topExperiencesRows.map(r => ({ name: r.name, count: Number(r.count) })),
  }
})
