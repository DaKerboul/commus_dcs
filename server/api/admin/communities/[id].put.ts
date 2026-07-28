import { eq } from 'drizzle-orm'
import { communities } from '#server/db/schema'
import type { RelationKind } from '#server/utils/community-write'

const ALL_RELATIONS: RelationKind[] = [
  'moduleNames',
  'soughtModuleNames',
  'experienceNames',
  'historicalPeriods',
  'images',
]

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const id = parseInt(getRouterParam(event, 'id') || '', 10)
  const body = await readBody(event)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  await snapshotCommunity(id, null)

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

  await syncCommunityRelations(id, body, ALL_RELATIONS)

  return community
})
