import { eq, inArray } from 'drizzle-orm'
import {
  communities,
  communityModules,
  communitySoughtModules,
  modules,
  communityExperiences,
  experiences,
  communityHistoricalPeriods,
  communityImages,
} from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  const [community] = await db
    .select()
    .from(communities)
    .where(eq(communities.slug, slug))
    .limit(1)

  if (!community) {
    throw createError({ statusCode: 404, statusMessage: 'Community not found' })
  }

  // Fetch all relations in parallel
  const [modRows, soughtModRows, expRows, periodRows, imageRows] = await Promise.all([
    db
      .select({ moduleName: modules.name })
      .from(communityModules)
      .innerJoin(modules, eq(communityModules.moduleId, modules.id))
      .where(eq(communityModules.communityId, community.id)),
    db
      .select({ moduleName: modules.name })
      .from(communitySoughtModules)
      .innerJoin(modules, eq(communitySoughtModules.moduleId, modules.id))
      .where(eq(communitySoughtModules.communityId, community.id)),
    db
      .select({ experienceName: experiences.name })
      .from(communityExperiences)
      .innerJoin(experiences, eq(communityExperiences.experienceId, experiences.id))
      .where(eq(communityExperiences.communityId, community.id)),
    db
      .select({ period: communityHistoricalPeriods.period })
      .from(communityHistoricalPeriods)
      .where(eq(communityHistoricalPeriods.communityId, community.id)),
    db
      .select({ url: communityImages.url, alt: communityImages.alt })
      .from(communityImages)
      .where(eq(communityImages.communityId, community.id))
      .orderBy(communityImages.sortOrder),
  ])

  return {
    id: community.id,
    slug: community.slug,
    name: community.name,
    shortDescription: community.shortDescription,
    description: community.description,
    objectives: community.objectives,
    logoUrl: community.logoUrl,
    sizeCategory: community.sizeCategory,
    communityType: community.communityType,
    recruitmentStatus: community.recruitmentStatus,
    eventFrequency: community.eventFrequency,
    founder: community.founder,
    contact: community.contact,
    entryConditions: community.entryConditions,
    sizeText: community.sizeText,
    discordUrl: community.discordUrl,
    websiteUrl: community.websiteUrl,
    youtubeUrl: community.youtubeUrl,
    instagramUrl: community.instagramUrl,
    facebookUrl: community.facebookUrl,
    twitchUrl: community.twitchUrl,
    twitterUrl: community.twitterUrl,
    otherLinks: community.otherLinks,
    featured: community.featured,
    published: community.published,
    votes: community.votes || 0,
    createdAt: community.createdAt?.toISOString(),
    updatedAt: community.updatedAt?.toISOString(),
    moduleNames: modRows.map(r => r.moduleName),
    soughtModuleNames: soughtModRows.map(r => r.moduleName),
    experienceNames: expRows.map(r => r.experienceName),
    historicalPeriods: periodRows.map(r => r.period),
    images: imageRows,
  }
})
