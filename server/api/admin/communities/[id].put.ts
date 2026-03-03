import { eq } from 'drizzle-orm'
import {
  communities,
  communityModules,
  communitySoughtModules,
  communityExperiences,
  communityHistoricalPeriods,
  modules,
  experiences,
} from '#server/db/schema'

async function requireAdmin(event: any) {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const id = parseInt(getRouterParam(event, 'id')!)
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  // Update community
  const [community] = await db.update(communities).set({
    name: body.name,
    slug: body.slug,
    shortDescription: body.shortDescription || null,
    description: body.description || null,
    objectives: body.objectives || null,
    logoUrl: body.logoUrl || null,
    sizeCategory: body.sizeCategory || 'unknown',
    communityType: body.communityType || 'other',
    recruitmentStatus: body.recruitmentStatus || 'unknown',
    eventFrequency: body.eventFrequency || 'unknown',
    founder: body.founder || null,
    contact: body.contact || null,
    entryConditions: body.entryConditions || null,
    sizeText: body.sizeText || null,
    discordUrl: body.discordUrl || null,
    websiteUrl: body.websiteUrl || null,
    youtubeUrl: body.youtubeUrl || null,
    instagramUrl: body.instagramUrl || null,
    facebookUrl: body.facebookUrl || null,
    twitchUrl: body.twitchUrl || null,
    twitterUrl: body.twitterUrl || null,
    otherLinks: body.otherLinks || null,
    featured: body.featured || false,
    published: body.published !== false,
    updatedAt: new Date(),
  }).where(eq(communities.id, id)).returning()

  if (!community) {
    throw createError({ statusCode: 404, statusMessage: 'Community not found' })
  }

  // Replace relations
  await Promise.all([
    db.delete(communityModules).where(eq(communityModules.communityId, id)),
    db.delete(communitySoughtModules).where(eq(communitySoughtModules.communityId, id)),
    db.delete(communityExperiences).where(eq(communityExperiences.communityId, id)),
    db.delete(communityHistoricalPeriods).where(eq(communityHistoricalPeriods.communityId, id)),
  ])

  if (body.moduleNames?.length) {
    const mods = await db.select().from(modules)
    const modMap = new Map(mods.map(m => [m.name, m.id]))
    const modValues = body.moduleNames
      .filter((n: string) => modMap.has(n))
      .map((n: string) => ({ communityId: id, moduleId: modMap.get(n)! }))
    if (modValues.length) await db.insert(communityModules).values(modValues)
  }

  if (body.soughtModuleNames?.length) {
    const mods = await db.select().from(modules)
    const modMap = new Map(mods.map(m => [m.name, m.id]))
    const modValues = body.soughtModuleNames
      .filter((n: string) => modMap.has(n))
      .map((n: string) => ({ communityId: id, moduleId: modMap.get(n)! }))
    if (modValues.length) await db.insert(communitySoughtModules).values(modValues)
  }

  if (body.experienceNames?.length) {
    const exps = await db.select().from(experiences)
    const expMap = new Map(exps.map(e => [e.name, e.id]))
    const expValues = body.experienceNames
      .filter((n: string) => expMap.has(n))
      .map((n: string) => ({ communityId: id, experienceId: expMap.get(n)! }))
    if (expValues.length) await db.insert(communityExperiences).values(expValues)
  }

  if (body.historicalPeriods?.length) {
    const periodValues = body.historicalPeriods.map((p: string) => ({
      communityId: id,
      period: p,
    }))
    await db.insert(communityHistoricalPeriods).values(periodValues)
  }

  return community
})
