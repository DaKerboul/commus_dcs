import { eq, ilike, and, inArray, sql, asc, desc, count } from 'drizzle-orm'
import {
  communities,
  communityModules,
  modules,
  communityExperiences,
  experiences,
  communityHistoricalPeriods,
} from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)

  // Parse filters
  const search = (query.search as string) || ''
  const moduleFilter = query.modules ? (query.modules as string).split(',') : []
  const typeFilter = query.communityType ? (query.communityType as string).split(',') : []
  const sizeFilter = query.sizeCategory ? (query.sizeCategory as string).split(',') : []
  const recruitmentFilter = query.recruitmentStatus ? (query.recruitmentStatus as string).split(',') : []
  const frequencyFilter = query.eventFrequency ? (query.eventFrequency as string).split(',') : []
  const periodFilter = query.historicalPeriods ? (query.historicalPeriods as string).split(',') : []
  const experienceFilter = query.experiences ? (query.experiences as string).split(',') : []
  const sort = (query.sort as string) || 'name'
  const sortDir = (query.sortDir as string) || 'asc'
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 50))

  // Build conditions
  const conditions: any[] = [eq(communities.published, true)]

  if (search) {
    conditions.push(
      sql`(unaccent(${communities.name}) ILIKE unaccent(${'%' + search + '%'}) OR unaccent(COALESCE(${communities.shortDescription}, '')) ILIKE unaccent(${'%' + search + '%'}) OR unaccent(COALESCE(${communities.description}, '')) ILIKE unaccent(${'%' + search + '%'}))`
    )
  }

  if (typeFilter.length > 0) {
    conditions.push(inArray(communities.communityType, typeFilter as any))
  }
  if (sizeFilter.length > 0) {
    conditions.push(inArray(communities.sizeCategory, sizeFilter as any))
  }
  if (recruitmentFilter.length > 0) {
    conditions.push(inArray(communities.recruitmentStatus, recruitmentFilter as any))
  }
  if (frequencyFilter.length > 0) {
    conditions.push(inArray(communities.eventFrequency, frequencyFilter as any))
  }

  // Subquery filters for many-to-many
  if (moduleFilter.length > 0) {
    conditions.push(
      sql`${communities.id} IN (
        SELECT cm.community_id FROM community_modules cm
        JOIN modules m ON cm.module_id = m.id
        WHERE m.name IN (${sql.join(moduleFilter.map(m => sql`${m}`), sql`,`)})
      )`
    )
  }

  if (experienceFilter.length > 0) {
    conditions.push(
      sql`${communities.id} IN (
        SELECT ce.community_id FROM community_experiences ce
        JOIN experiences e ON ce.experience_id = e.id
        WHERE e.slug IN (${sql.join(experienceFilter.map(e => sql`${e}`), sql`,`)})
      )`
    )
  }

  if (periodFilter.length > 0) {
    conditions.push(
      sql`${communities.id} IN (
        SELECT chp.community_id FROM community_historical_periods chp
        WHERE chp.period IN (${sql.join(periodFilter.map(p => sql`${p}`), sql`,`)})
      )`
    )
  }

  const where = and(...conditions)

  // Count total
  const [{ total }] = await db
    .select({ total: count() })
    .from(communities)
    .where(where)

  // Sort
  const sortColumn = sort === 'size' ? communities.sizeCategory
    : sort === 'updated' ? communities.updatedAt
    : sort === 'created' ? communities.createdAt
    : sort === 'founded' ? communities.foundedDate
    : sort === 'votes' ? communities.votes
    : communities.name
  const sortFn = sortDir === 'desc' ? desc : asc

  // Fetch communities
  const rows = await db
    .select()
    .from(communities)
    .where(where)
    .orderBy(sortFn(sortColumn))
    .limit(limit)
    .offset((page - 1) * limit)

  // Fetch related data for all returned communities
  const communityIds = rows.map(r => r.id)

  if (communityIds.length === 0) {
    return {
      data: [],
      total: Number(total),
      page,
      limit,
      totalPages: 0,
    }
  }

  // Modules
  const modRows = await db
    .select({
      communityId: communityModules.communityId,
      moduleName: modules.name,
    })
    .from(communityModules)
    .innerJoin(modules, eq(communityModules.moduleId, modules.id))
    .where(inArray(communityModules.communityId, communityIds))

  // Experiences
  const expRows = await db
    .select({
      communityId: communityExperiences.communityId,
      experienceName: experiences.name,
    })
    .from(communityExperiences)
    .innerJoin(experiences, eq(communityExperiences.experienceId, experiences.id))
    .where(inArray(communityExperiences.communityId, communityIds))

  // Historical periods
  const periodRows = await db
    .select({
      communityId: communityHistoricalPeriods.communityId,
      period: communityHistoricalPeriods.period,
    })
    .from(communityHistoricalPeriods)
    .where(inArray(communityHistoricalPeriods.communityId, communityIds))

  // Build lookup maps
  const modMap = new Map<number, string[]>()
  for (const row of modRows) {
    if (!modMap.has(row.communityId)) modMap.set(row.communityId, [])
    modMap.get(row.communityId)!.push(row.moduleName)
  }

  const expMap = new Map<number, string[]>()
  for (const row of expRows) {
    if (!expMap.has(row.communityId)) expMap.set(row.communityId, [])
    expMap.get(row.communityId)!.push(row.experienceName)
  }

  const periodMap = new Map<number, string[]>()
  for (const row of periodRows) {
    if (!periodMap.has(row.communityId)) periodMap.set(row.communityId, [])
    periodMap.get(row.communityId)!.push(row.period)
  }

  const data = rows.map(c => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    shortDescription: c.shortDescription,
    logoUrl: c.logoUrl,
    sizeCategory: c.sizeCategory,
    communityType: c.communityType,
    recruitmentStatus: c.recruitmentStatus,
    eventFrequency: c.eventFrequency,
    discordUrl: c.discordUrl,
    websiteUrl: c.websiteUrl,
    votes: c.votes || 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    foundedDate: c.foundedDate || null,
    moduleNames: modMap.get(c.id) || [],
    experienceNames: expMap.get(c.id) || [],
    historicalPeriods: periodMap.get(c.id) || [],
  }))

  return {
    data,
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  }
})
