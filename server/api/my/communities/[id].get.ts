import { eq } from 'drizzle-orm'
import {
  communities,
  communityExperiences,
  communityHistoricalPeriods,
  communityImages,
  communityModules,
  communitySoughtModules,
  experiences,
  modules,
} from '#server/db/schema'

// GET /api/my/communities/:id - editable state of a community the caller manages
export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '', 10)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  await requireCommunityRole(event, id, 'editor')

  const db = useDB()
  const [community] = await db.select().from(communities).where(eq(communities.id, id)).limit(1)

  if (!community) {
    throw createError({ statusCode: 404, statusMessage: 'Communauté introuvable' })
  }

  const [moduleRows, soughtRows, experienceRows, periodRows, imageRows] = await Promise.all([
    db.select({ name: modules.name }).from(communityModules)
      .innerJoin(modules, eq(communityModules.moduleId, modules.id))
      .where(eq(communityModules.communityId, id)),
    db.select({ name: modules.name }).from(communitySoughtModules)
      .innerJoin(modules, eq(communitySoughtModules.moduleId, modules.id))
      .where(eq(communitySoughtModules.communityId, id)),
    db.select({ name: experiences.name }).from(communityExperiences)
      .innerJoin(experiences, eq(communityExperiences.experienceId, experiences.id))
      .where(eq(communityExperiences.communityId, id)),
    db.select().from(communityHistoricalPeriods).where(eq(communityHistoricalPeriods.communityId, id)),
    db.select().from(communityImages).where(eq(communityImages.communityId, id)).orderBy(communityImages.sortOrder),
  ])

  return {
    ...community,
    moduleNames: moduleRows.map(r => r.name),
    soughtModuleNames: soughtRows.map(r => r.name),
    experienceNames: experienceRows.map(r => r.name),
    historicalPeriods: periodRows.map(r => r.period),
    images: imageRows.map(r => ({ url: r.url, alt: r.alt })),
  }
})
